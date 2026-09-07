import base64
import io
import os
import json
import re
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from docx import Document
from pypdf import PdfReader

load_dotenv()

API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
MODEL = os.getenv("AZURE_OPENAI_MODEL")

if not API_KEY:
    raise ValueError("AZURE_OPENAI_API_KEY is missing")

if not ENDPOINT:
    raise ValueError("AZURE_OPENAI_ENDPOINT is missing")

if not MODEL:
    raise ValueError("AZURE_OPENAI_MODEL is missing")


client = OpenAI(
    api_key=API_KEY,
    base_url=f"{ENDPOINT}/openai/v1/"
)


TASK_INSTRUCTIONS = {
    "improve": "Improve existing copy only. Rewrite the submitted text using e& CX guidelines: preserve its meaning, facts, audience, channel, and call to action; correct grammar and spelling; make it clearer, shorter, more direct, and more customer-friendly. Do not add claims, features, offers, or information that is not in the input.",
    "write": "Write new customer-facing copy from the user's brief. Treat the input as requirements, not as copy to rewrite. Use only facts supplied in the brief, choose an appropriate format and tone for the stated channel and audience, and include one clear customer action when the brief supports it. Do not discuss your process.",
    "review": "Review the submitted copy. Do not silently rewrite it as if this were Improve. Evaluate clarity, customer value, tone, grammar, terminology, claims, structure, and CTA against the e& CX guidelines. Return a concise review with these headings: Score, What works, Issues, Guideline checks, and Recommended changes. Quote short examples from the submitted copy where useful, but do not provide a full rewritten version.",
    "translate": "Translate the submitted copy only. Preserve meaning, intent, formatting, product names, plan names, e& terminology, numbers, URLs, and calls to action. Use the approved English-Arabic glossary. If the source is English, translate to Arabic; if the source is Arabic, translate to English. Do not explain the translation or add content.",
}


TASK_OUTPUT_RULES = {
    "improve": "Return only the rewritten improved copy. Do not include explanations, a title, suggestions, alternatives, bullet points, or questions.",
    "write": "Return only the new copy. Do not include a title, explanation, notes, alternatives, or questions.",
    "review": "Return only the review using the requested headings. Do not add a full rewrite or pretend the submitted copy was rewritten.",
    "translate": "Return only the translation. Do not include a title, explanation, transliteration, alternatives, or questions.",
}


CHANNEL_OPTIONS = [
        "Email",
        "SMS",
        "Website",
        "App / Push Notification",
        "In-app message",
        "Other",
]

AUDIENCE_OPTIONS = [
        "Emirati",
        "Youth",
        "White Collar",
        "Blue Collar",
        "Single Professionals",
        "Business",
        "Unknown",
]


CONTEXT_DETECTION_INSTRUCTIONS = f"""
Detect the most likely customer communication channel and target audience for the submitted text using the e& CX Writing Guidelines.

Return valid JSON only with this exact shape:
{{
    "channel": "one value from {CHANNEL_OPTIONS}",
    "audience": "one value from {AUDIENCE_OPTIONS}",
    "channel_confidence": 0,
    "audience_confidence": 0,
    "reason": "One short explanation of the signals used."
}}

Rules:
- Use App / Push Notification for app notifications and push notifications.
- Use In-app message only when the text is clearly an in-app surface/message; it follows the App guidance in the source document.
- Use Other when no listed channel is a reasonable fit.
- Use Unknown when the text gives no reliable audience signal. Never infer audience from a name, image, language alone, or stereotypes.
- Confidence is an integer from 0 to 100.
"""


ANALYSIS_INSTRUCTIONS = """
Analyze the generated copy against the e& CX Writing Guidelines above. Compare the copy word by word and phrase by phrase with the guidelines, but judge the meaning and context rather than requiring exact guideline wording.

Return valid JSON only, using exactly this shape:
{
    "score": 0,
    "rating": "Needs improvement",
    "summary": "One brief sentence about guideline compliance.",
    "findings": [
        {"phrase": "exact weak phrase from the generated copy", "reason": "brief guideline issue", "suggestion": "brief manual change"}
    ],
    "highlighted_phrases": ["exact weak phrase from the generated copy"],
    "manual_suggestion": "One brief, practical suggestion for the user."
}

Rules:
- score is an integer from 0 to 100. Use 85-100 for Strong, 70-84 for Mostly meets, and below 70 for Needs improvement.
- Only include findings for real issues such as unclear wording, unnecessary complexity, passive voice, jargon, unsupported claims, weak customer value, poor CTA, grammar, or a terminology violation.
- highlighted_phrases must be exact contiguous phrases copied from the generated text, with at most 8 phrases.
- Keep all explanations concise. Do not rewrite the full copy in this response.
"""


WEAK_REWRITE_INSTRUCTIONS = """
Rewrite the generated copy to address the identified weak phrases while following every e& CX Writing Guideline. Preserve the intended meaning, facts, tone, and useful wording. Do not invent facts. Return only the complete rewritten copy, with no explanation, labels, or quotation marks.
"""


PROMPT_FILE = Path(__file__).parent / "prompt" / "eand_CX_Writing_AI_Instructions_SLIDE_FORMAT_EN_AR.md"


@lru_cache
def load_writing_guidelines() -> str:
    """Load the e& CX writing rules that are sent with every AI request."""
    if not PROMPT_FILE.is_file():
        raise FileNotFoundError(f"Writing guidelines file was not found: {PROMPT_FILE}")

    return PROMPT_FILE.read_text(encoding="utf-8")


def build_task_prompt(
    feedback: str,
    task: str = "improve",
    channel: str = "Other",
    audience: str = "Unknown",
) -> str:
    task_instruction = TASK_INSTRUCTIONS[task]
    output_rules = TASK_OUTPUT_RULES[task]
    return f"""
{load_writing_guidelines()}

---

You are an e& CX Writing Assistant. Apply the e& CX Writing Guidelines above.

Context to apply:
- Channel: {channel}
- Target audience: {audience}
Use the channel rules and audience rules that match this context. If the channel is Other or the audience is Unknown, use the neutral CX voice and do not invent assumptions.

Task:
{task_instruction}

Original copy:
{feedback}

Output requirements:
{output_rules}
"""


def enhance_feedback(
    feedback: str,
    task: str = "improve",
    channel: str = "Other",
    audience: str = "Unknown",
) -> str:
    instructions = build_task_prompt(feedback, task, channel, audience)

    response = client.responses.create(
        model=MODEL,
        instructions=instructions,
        input=feedback
    )

    return response.output_text


def detect_copy_context(feedback: str) -> dict:
    instructions = f"""
{load_writing_guidelines()}

You are an e& CX context classifier.
{CONTEXT_DETECTION_INSTRUCTIONS}

Text to classify:
{feedback}
"""
    response = client.responses.create(
        model=MODEL,
        instructions=instructions,
        input=feedback,
    )
    context = _parse_json_response(response.output_text)
    if context.get("channel") not in CHANNEL_OPTIONS:
        context["channel"] = "Other"
    if context.get("audience") not in AUDIENCE_OPTIONS:
        context["audience"] = "Unknown"
    context["channel_confidence"] = max(0, min(100, int(context.get("channel_confidence", 0))))
    context["audience_confidence"] = max(0, min(100, int(context.get("audience_confidence", 0))))
    return context


def _parse_json_response(output: str) -> dict:
    cleaned = output.strip()
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.IGNORECASE)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            raise ValueError("The guideline analysis returned invalid JSON") from None
        return json.loads(match.group(0))


def analyze_copy(generated: str, original: str = "") -> dict:
    instructions = f"""
{load_writing_guidelines()}

You are an e& CX copy quality evaluator.
{ANALYSIS_INSTRUCTIONS}

Original user copy (context only):
{original or "Not provided"}

Generated copy to evaluate:
{generated}
"""
    response = client.responses.create(
        model=MODEL,
        instructions=instructions,
        input=generated,
    )
    analysis = _parse_json_response(response.output_text)
    analysis["score"] = max(0, min(100, int(analysis.get("score", 0))))
    analysis["highlighted_phrases"] = [
        phrase for phrase in analysis.get("highlighted_phrases", [])
        if isinstance(phrase, str) and phrase.strip()
    ][:8]
    return analysis


def rewrite_weak_phrases(generated: str, findings: list[dict]) -> str:
    weak_phrases = "\n".join(
        f"- {item.get('phrase', '')}: {item.get('reason', '')}"
        for item in findings
        if item.get("phrase")
    )
    instructions = f"""
{load_writing_guidelines()}

You are an e& CX Writing Assistant.
{WEAK_REWRITE_INSTRUCTIONS}

Weak phrases and issues identified by the evaluator:
{weak_phrases or "Recheck the copy carefully against all guidelines."}

Generated copy:
{generated}
"""
    response = client.responses.create(
        model=MODEL,
        instructions=instructions,
        input=generated,
    )
    return response.output_text


def extract_uploaded_content(filename: str, content_type: str, file_bytes: bytes) -> str:
    suffix = Path(filename).suffix.lower()

    if content_type.startswith("image/"):
        image_data = base64.b64encode(file_bytes).decode("ascii")
        response = client.responses.create(
            model=MODEL,
            instructions="Read all meaningful customer-facing text in this image. Return only the extracted text, preserving its wording and line breaks where possible.",
            input=[{
                "role": "user",
                "content": [
                    {"type": "input_text", "text": "Extract the text from this image."},
                    {"type": "input_image", "image_url": f"data:{content_type};base64,{image_data}"},
                ],
            }],
        )
        return response.output_text.strip()

    if suffix == ".pdf" or content_type == "application/pdf":
        reader = PdfReader(io.BytesIO(file_bytes))
        return "\n\n".join(page.extract_text() or "" for page in reader.pages).strip()

    if suffix == ".docx" or content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        document = Document(io.BytesIO(file_bytes))
        return "\n".join(paragraph.text for paragraph in document.paragraphs if paragraph.text.strip()).strip()

    if suffix in {".txt", ".md", ".csv", ".json"} or content_type.startswith("text/") or content_type == "application/json":
        return file_bytes.decode("utf-8-sig").strip()

    raise ValueError("Unsupported file type. Upload an image, PDF, DOCX, TXT, MD, CSV, or JSON file.")

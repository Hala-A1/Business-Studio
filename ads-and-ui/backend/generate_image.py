import base64
import io
import os
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

def generate_image(prompt: str, size: str, samples: int, quality: str = "low", source_image: bytes | None = None) -> list[str]:
    client = AzureOpenAI(
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        api_version="2025-04-01-preview",
    )
    request = {
        "model": os.environ["AZURE_OPENAI_DEPLOYMENT"],
        "prompt": prompt,
        "n": samples,
        "size": size.replace(" ", ""),
        "quality": quality,
        "output_format": "png",
    }
    if source_image:
        image_file = io.BytesIO(source_image)
        image_file.name = "product.png"
        result = client.images.edit(image=image_file, **request)
    else:
        result = client.images.generate(**request)
    return [item.b64_json for item in result.data if item.b64_json]


if __name__ == "__main__":
    user_prompt = input("What do you want to generate? ")
    image_base64 = generate_image(user_prompt, "1024 x 1024", 1, quality="low")[0]
    with open("generated_image.png", "wb") as image_file:
        image_file.write(base64.b64decode(image_base64))
    print("\nImage saved as: generated_image.png")
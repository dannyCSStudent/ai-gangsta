import os
import json
import logging
from typing import List, Dict, Any, Optional

from groq import Groq

logger = logging.getLogger(__name__)

# Lazy initialize the Groq client
_groq_client = None

def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            logger.warning("GROQ_API_KEY not found. Groq client not initialized.")
            return None
        _groq_client = Groq(api_key=api_key)
    return _groq_client

async def recognize_entities(text: str) -> Optional[Dict[str, List[str]]]:
    """
    Recognizes and categorizes entities (Person, Organization, Location, Event) from text.
    Returns a dictionary of recognized entities or None on failure.
    """
    groq_client = _get_groq_client()
    if not groq_client:
        return None

    prompt = f"""
    You are an expert entity recognition AI. Your task is to identify and list all named entities from the text provided.
    
    Categorize the entities into the following types:
    - `PERSON`: Named people.
    - `ORGANIZATION`: Companies, institutions, or groups.
    - `LOCATION`: Specific places, cities, or countries.
    - `EVENT`: Significant historical or ongoing events.
    
    If no entities of a certain type are found, return an empty array for that key. Do not make up entities.
    
    Respond with a JSON object containing the recognized entities.
    
    Example output format:
    ```json
    {{
      "persons": ["Elon Musk", "Joe Biden"],
      "organizations": ["SpaceX", "Tesla"],
      "locations": ["New York", "Paris"],
      "events": ["The Super Bowl"]
    }}
    ```
    
    Now, analyze the following text and extract the entities:
    
    Text:
    "{text}"
    """
    
    response_content = None
    try:
        completion = groq_client.chat.completions.with_raw_response.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        parsed_response_obj = completion.parse()
        response_content = parsed_response_obj.choices[0].message.content
        parsed_response = json.loads(response_content)
        return parsed_response
    except Exception as e:
        logger.error(f"Failed to recognize entities with Groq: {e}\nResponse text: {response_content}")
        return None

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

async def extract_claims_with_groq(caption: str) -> Optional[List[str]]:
    """
    Extracts a list of factual claims from a caption using Groq.
    Returns a list of claims or None on failure.
    """
    groq_client = _get_groq_client()
    if not groq_client:
        return None

    prompt = f"""
    You are a highly analytical AI trained to extract factual claims from text.
    Your task is to identify and extract every single verifiable claim from the following caption.
    A claim is a statement that can be proven true or false by evidence.
    
    The user is trying to test if the caption is supported by a piece of media, so focus on claims that describe the media's content.
    
    Example input: "A woman in a city working out in the morning."
    Example output:
    ```json
    {{
      "claims": [
        "a woman exists",
        "the woman is in a city",
        "the woman is working out",
        "it is morning"
      ]
    }}
    ```
    
    Now, extract the claims from this caption. Do not include any claims that are opinions, subjective statements, or non-verifiable. Respond with a JSON object containing a single key "claims" which is an array of strings.
    
    Caption: "{caption}"
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
        # Correctly parse the raw response
        parsed_response_obj = completion.parse()
        response_content = parsed_response_obj.choices[0].message.content
        parsed_response = json.loads(response_content)
        claims = parsed_response.get("claims", [])
        return claims
    except Exception as e:
        logger.error(f"Failed to extract claims from Groq: {e}\nResponse text: {response_content}")
        return None


async def compare_claims_with_groq(claims: List[str], summary: str) -> Optional[Dict[str, Any]]:
    """
    Compares a list of claims against a factual summary using Groq.
    Returns a JSON object with the comparison results or None on failure.
    """
    groq_client = _get_groq_client()
    if not groq_client:
        return None

    claims_str = "\n".join([f"- {c}" for c in claims])
    prompt = f"""
    You are a fact-checking AI. Your task is to compare a list of factual claims against a summary of a piece of media. For each claim, you must determine its status based on the summary.
    
    Possible statuses:
    - "supported": The claim is directly supported by the media summary.
    - "contradicted": The claim is directly contradicted by the media summary.
    - "not_addressed": The claim is not mentioned or addressed in the media summary.
    
    Instructions:
    - Analyze each claim one by one.
    - For each claim, provide a brief, one-sentence explanation for its status.
    - Do not make assumptions. Stick strictly to the information provided in the summary.
    - Respond with a JSON object containing a single key "results" which is an array of objects.
    
    Summary of Media Content:
    {summary}
    
    Claims to Evaluate:
    {claims_str}
    
    Respond in the following JSON format:
    {{
      "results": [
        {{
          "claim": "a woman exists",
          "status": "contradicted",
          "explanation": "The summary mentions a man, not a woman."
        }},
        {{
          "claim": "the woman is in a city",
          "status": "not_addressed",
          "explanation": "The summary does not provide details on the location being a city."
        }}
      ]
    }}
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
        logger.error(f"Failed to compare claims with Groq: {e}\nResponse text: {response_content}")
        return None

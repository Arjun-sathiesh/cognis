import os
import json
import re
from typing import Optional, Dict, Any, List

def get_api_keys() -> Dict[str, str]:
    return {
        "anthropic": os.environ.get("ANTHROPIC_API_KEY", "").strip(),
        "openai": os.environ.get("OPENAI_API_KEY", "").strip(),
        "gemini": os.environ.get("GEMINI_API_KEY", "").strip(),
        "groq": os.environ.get("GROQ_API_KEY", "").strip(),
        "openrouter": os.environ.get("OPENROUTER_API_KEY", "").strip(),
    }

def call_llm(
    prompt: str,
    system_prompt: str = "You are Cognis, an organizational software engineering intelligence system.",
    temperature: float = 0.2,
    custom_key: Optional[str] = None,
    provider: Optional[str] = None
) -> str:
    """
    Calls available LLM provider in order of availability:
    1. Anthropic Claude (if key available)
    2. OpenAI (if key available)
    3. Gemini (if key available)
    4. Groq (if key available)
    5. Fallback rule-based structured generator
    """
    keys = get_api_keys()
    
    # 1. Try Anthropic
    anthropic_key = custom_key if provider == "anthropic" else keys.get("anthropic")
    if anthropic_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key)
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4096,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}]
            )
            if response.content and len(response.content) > 0:
                return response.content[0].text
        except Exception as e:
            print(f"[LLM] Anthropic call failed: {e}. Trying fallback providers...")

    # 2. Try OpenAI
    openai_key = custom_key if provider == "openai" else keys.get("openai")
    if openai_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            print(f"[LLM] OpenAI call failed: {e}. Trying fallback providers...")

    # 3. Try Gemini
    gemini_key = custom_key if provider == "gemini" else keys.get("gemini")
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=f"{system_prompt}\n\n{prompt}"
            )
            return response.text or ""
        except Exception as e:
            print(f"[LLM] Gemini call failed: {e}...")

    # 4. Try Groq
    groq_key = custom_key if provider == "groq" else keys.get("groq")
    if groq_key:
        try:
            from openai import OpenAI
            client = OpenAI(
                base_url="https://api.groq.com/openai/v1",
                api_key=groq_key
            )
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            print(f"[LLM] Groq call failed: {e}...")

    # 5. Try OpenRouter through its OpenAI-compatible API
    openrouter_key = custom_key if provider == "openrouter" else keys.get("openrouter")
    if openrouter_key:
        try:
            from openai import OpenAI
            client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=openrouter_key,
                default_headers={"HTTP-Referer": "http://localhost:5173"}
            )
            response = client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            print(f"[LLM] OpenRouter call failed: {e}...")

    raise RuntimeError("No working LLM provider available or API keys valid.")

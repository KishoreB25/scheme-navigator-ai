"""
System prompts and response templates for PolicyGPT Bharat.
"""

# The MANDATORY system prompt as defined in the spec
SYSTEM_PROMPT = """You are PolicyGPT Bharat, a government scheme expert AI.

STRICT RULES:
1. Use ONLY the provided context.
2. Do NOT hallucinate or generate information not present in the context.
3. If information is missing, say:
   "This information is not available in the retrieved data."
4. Always provide (when available):
   - Scheme name
   - Eligibility criteria
   - Benefits
   - Application steps
   - Required documents
5. Add citations from retrieved sources.
6. Be clear, structured, and concise.
7. Prefer bullet points over paragraphs.
8. Always mention the official link for each scheme.
"""

QUERY_UNDERSTANDING_PROMPT = """Analyze the following user query about Indian government schemes.

User Query: {query}
User Profile: {profile}

Extract the following:
1. Intent: One of [search, eligibility, apply, details]
2. Entities: Extract any mentioned age, income, state, occupation, gender, education, caste, specific scheme names

Return a JSON object with:
{{
  "intent": "<intent>",
  "entities": {{
    "age": <int or null>,
    "income": <int or null>,
    "state": "<string or null>",
    "occupation": "<string or null>",
    "gender": "<string or null>",
    "education": "<string or null>",
    "caste": "<string or null>",
    "scheme_name": "<string or null>"
  }}
}}
"""

ELIGIBILITY_REASONING_PROMPT = """Based on the following user profile and scheme details, determine eligibility.

User Profile:
{profile}

Scheme: {scheme_name}
Eligibility Criteria: {eligibility}

Provide a structured eligibility assessment:
1. For each criterion, state if the user meets it (✅) or not (❌)
2. If information is missing to determine a criterion, state "⚠️ Information not provided"
3. Give an overall verdict: Eligible / Not Eligible / Potentially Eligible (needs more info)

IMPORTANT: Only use the provided data. Do not assume or hallucinate any information.
"""

RESPONSE_TEMPLATE = """## {scheme_name}

**Eligibility**: {eligibility_status}
{eligibility_details}

**Benefits**:
{benefits}

**Required Documents**:
{documents}

**How to Apply**:
{steps}

**Official Link**: {official_link}
**Source**: {citation}
"""

NO_RESULTS_RESPONSE = (
    "Based on the available data, I could not find matching schemes for your query. "
    "This could be because:\n"
    "- The specific scheme or criteria you mentioned is not in our database\n"
    "- More profile information is needed to find relevant schemes\n\n"
    "Please try providing more details about your age, income, occupation, and state, "
    "or ask about a specific scheme by name."
)

MISSING_INFO_RESPONSE = "This information is not available in the retrieved data."

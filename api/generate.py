from http.server import BaseHTTPRequestHandler
import json
import os
from typing import List
from openai import OpenAI
from pydantic import BaseModel

MAX_BODY_BYTES = 10_000
ALLOWED_TIMES = {"15분 이내", "30분 이내", "60분 이내"}
ALLOWED_DIFFICULTIES = {"아주 쉬움", "보통", "도전"}

class Recipe(BaseModel):
    title: str
    summary: str
    time: str
    difficulty: str
    servings: int
    ingredients: List[str]
    steps: List[str]
    substitutions: List[str]
    leftover_tip: str
    caution: str

class handler(BaseHTTPRequestHandler):
    def _send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_BODY_BYTES:
                return self._send_json(400, {"error": "요청 데이터 크기가 올바르지 않습니다."})

            data = json.loads(self.rfile.read(length).decode("utf-8"))
            ingredients = str(data.get("ingredients", "")).strip()
            if not ingredients:
                return self._send_json(400, {"error": "보유 재료를 입력해 주세요."})
            if len(ingredients) > 300:
                return self._send_json(400, {"error": "재료는 300자 이내로 입력해 주세요."})

            time_limit = data.get("time") if data.get("time") in ALLOWED_TIMES else "30분 이내"
            difficulty = data.get("difficulty") if data.get("difficulty") in ALLOWED_DIFFICULTIES else "보통"
            tools = data.get("tools") if isinstance(data.get("tools"), list) else []
            tools = [str(x)[:30] for x in tools[:6]]
            exclude = str(data.get("exclude", ""))[:150].strip() or "없음"
            servings = max(1, min(8, int(data.get("servings", 1))))

            api_key = os.environ.get("OPENAI_API_KEY")
            if not api_key:
                return self._send_json(500, {"error": "서버 환경 변수 OPENAI_API_KEY가 설정되지 않았습니다."})

            client = OpenAI(api_key=api_key, timeout=25.0, max_retries=1)
            model = os.environ.get("OPENAI_MODEL", "gpt-5-mini")
            prompt = f"""다음 조건에 맞는 가정식 레시피 1개를 한국어로 제안하세요.
보유 재료: {ingredients}
조리 시간: {time_limit}
난이도: {difficulty}
도구: {', '.join(tools) if tools else '제한 없음'}
제외 재료 또는 알레르기 유발 식품: {exclude}
인분: {servings}

제외 재료는 포함하지 마세요. 보유 재료를 우선 사용하고 기본 양념 외 추가 재료는 최소화하세요.
식재료 상태, 알레르기, 교차 오염, 충분한 가열을 사용자가 확인하도록 주의 문구를 넣으세요.
의학적 또는 영양학적 효능을 단정하지 마세요."""

            response = client.responses.parse(
                model=model,
                instructions="당신은 남은 식재료 활용을 돕는 신중한 가정식 레시피 도우미입니다.",
                input=prompt,
                text_format=Recipe,
            )
            recipe = response.output_parsed
            if recipe is None:
                return self._send_json(502, {"error": "AI가 레시피 형식의 응답을 만들지 못했습니다. 다시 시도해 주세요."})
            recipe.servings = servings
            return self._send_json(200, {"recipe": recipe.model_dump()})

        except json.JSONDecodeError:
            return self._send_json(400, {"error": "요청 데이터를 확인해 주세요."})
        except Exception as exc:
            print(f"generate error: {type(exc).__name__}: {exc}")
            return self._send_json(500, {"error": "레시피 생성 중 오류가 발생했습니다. Vercel 로그를 확인해 주세요."})

    def do_GET(self):
        return self._send_json(405, {"error": "POST 요청만 지원합니다."})

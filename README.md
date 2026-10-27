# quick-answer

Claude Code mod: Claude가 묻는 단일 선택 질문을 세션 설문처럼 입력창 위에 띄우고, 숫자 키 하나로 바로 답합니다. Enter는 필요 없습니다.

```
명세 다시 띄울까?
1: 전체    2: 할 일만    3: 안 띄움    0: Dismiss
> _
```

## 설치

터미널 Claude Code 세션의 프롬프트에서:

```
/plugin install quick-answer --marketplace Dorazeeing/claude-quick-answer
```

`Add marketplace?`에 `y`를 누르고 설치 범위(user 권장)를 고르면 바로 켜집니다.

셸에서:

```sh
claude plugin install quick-answer --marketplace Dorazeeing/claude-quick-answer
```

데스크톱 앱(`/plugin`이 안 되는 곳): 프롬프트 옆 **+** → **Plugins** → **Add marketplace**에 `Dorazeeing/claude-quick-answer` 입력 → **Add plugin**.

## 동작

- Claude가 `mcp__quick-answer__ask` 도구로 질문(`question`)과 선택지(`options`, 2~9개)를 보내면, 입력창 바로 위 밴드에 뜹니다.
- 입력창이 비어 있을 때 숫자를 누르면 즉시 답이 전송됩니다. `1`~`n`은 선택, `0`은 아무것도 보내지 않고 닫습니다.
- 질문은 답하거나 닫을 때까지 계속 떠 있습니다. 평소처럼 다른 프롬프트를 입력하고 보내도 질문은 그대로 남아 있습니다.
- 입력창에 글자가 있으면 숫자는 평소처럼 입력됩니다.
- 답은 내 메시지로 `질문 → 2: 할 일만` 형태로 Claude에게 전달됩니다. Claude가 작업 중이면 그 턴이 끝난 뒤 전달됩니다.
- 질문이 여러 개 쌓이면 오래된 것부터 하나씩 보여주고, 남은 개수를 `(+N)`으로 표시합니다.
- Claude Code 자체 설문이 떠 있는 동안에는 자리를 양보합니다.

mod는 시스템 프롬프트에 짧은 안내를 추가해서, 간단한 선택 질문은 번호 목록을 글로 쓰거나 AskUserQuestion을 띄우는 대신 이 도구를 쓰도록 Claude에게 알려줍니다. 여러 질문을 한꺼번에 묻거나 미리보기가 필요한 질문에는 계속 AskUserQuestion을 씁니다.

## 개발

```sh
claude --plugin-dir ./claude-quick-answer   # 이 폴더의 mod를 불러온 세션 시작
claude plugin validate ./claude-quick-answer
claude plugin test ./claude-quick-answer
```

에디터 타입 정보(`.claude-plugin/types/`)는 Claude Code가 mod를 불러올 때 자동으로 생성하며, git에는 포함하지 않습니다.

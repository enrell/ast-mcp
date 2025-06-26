import subprocess
import os
import json


def ts_change_function_signature(
    project_root: str, function_name: str, new_signature: str
) -> dict:
    """
    Changes the signature of a function in a TypeScript project using AST.
    Args:
      project_root: Path to the TypeScript project (must contain tsconfig.json)
      function_name: Name of the function to be changed
      new_signature: New signature, e.g.: "(a: number, b: string): void"
    Returns:
      dict with modified files and message
    """
    script_path = os.path.join(
        os.path.dirname(__file__), "../ast/typescript/change_signature.ts"
    )
    script_path = os.path.abspath(script_path)
    try:
        result = subprocess.run(
            [
                "npx",
                "ts-node",
                script_path,
                project_root,
                function_name,
                new_signature,
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        return {
            "ok": True,
            **(
                result.stdout
                and result.stdout.strip()
                and json.loads(result.stdout)
                or {}
            ),
        }
    except subprocess.CalledProcessError as e:
        return {"ok": False, "error": e.stderr or str(e)}


def register_ts_tools(mcp):
    """Register TypeScript tools with the MCP server"""
    mcp.tool()(ts_change_function_signature)

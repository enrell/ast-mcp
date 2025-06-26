from tools import Context


async def long_task(files: list[str], ctx: Context) -> str:
    """Process multiple files with progress tracking"""
    for i, file in enumerate(files):
        await ctx.info(f"Processing {file}")
        await ctx.report_progress(i, len(files))
        data, mime_type = await ctx.read_resource(f"file://{file}")
    return "Processing complete"


def register_long_task_tools(mcp):
    """Register long task tools with the MCP server"""
    mcp.tool()(long_task)

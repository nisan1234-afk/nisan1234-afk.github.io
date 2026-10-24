import asyncio,sys
from playwright.async_api import async_playwright
d=sys.argv[1]; ids=sys.argv[2].split(','); w=int(sys.argv[3]); h=int(sys.argv[4]); tag=sys.argv[5]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':w,'height':h})
        for sid in ids:
            await pg.goto("about:blank"); await pg.goto(f'file://{d}/index.html#'+sid); await pg.wait_for_timeout(400)
            await pg.screenshot(path=f'{d}/shot_{tag}_{sid}.png',full_page=True)
        await b.close()
asyncio.run(main())

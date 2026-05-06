# GitHub Setup

Codex can work with GitHub once the repository exists, but repository creation was not available through the connected GitHub plugin in this session.

## Repository

Use this GitHub repository:

https://github.com/GoodMorningStarShine/travel-map-maker.git

Codex can see the repository, and the connected GitHub account `susannahtace` has write access.

## Connect This Local Folder

From this folder:

```powershell
git remote add origin https://github.com/GoodMorningStarShine/travel-map-maker.git
git branch -M main
git add .
git commit -m "Initial travel map maker app"
git push -u origin main
```

If Git asks you to sign in, follow the browser prompt.

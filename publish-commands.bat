@echo off
echo Publishing LanShare...
echo.
echo STEP 1: Docker Login
docker login
echo.
echo STEP 2: Build and Push Image
docker build -t zhong12138/lanshare .
docker push zhong12138/lanshare
echo.
echo STEP 3: Push to GitHub
git remote add origin https://github.com/Danborad/lanshare-v1.git
git branch -M master
git push -u origin master
echo.
echo All done! Check your repositories:
echo GitHub: https://github.com/Danborad/lanshare-v1
echo Docker Hub: https://hub.docker.com/r/zhong12138/lanshare
pause

Write-Host "1. Building project..."
npm run build

Write-Host "2. Preparing remote directory..."
ssh deploy@72.61.255.210 "rm -rf /tmp/frontend-new && mkdir -p /tmp/frontend-new"

Write-Host "3. Copying files to server..."
scp -r dist/* deploy@72.61.255.210:/tmp/frontend-new/

Write-Host "4. Deploying to Docker container..."
ssh deploy@72.61.255.210 "docker exec test-repo-frontend-1 sh -c 'rm -rf /usr/share/nginx/html/*' && docker cp /tmp/frontend-new/. test-repo-frontend-1:/usr/share/nginx/html/ && docker exec test-repo-frontend-1 chmod -R 755 /usr/share/nginx/html/ && docker exec test-repo-frontend-1 chmod 644 /usr/share/nginx/html/assets/* && rm -rf /tmp/frontend-new && echo 'Deployment complete!'"

Write-Host "Done! Clear browser cache and refresh (Ctrl+Shift+R)."
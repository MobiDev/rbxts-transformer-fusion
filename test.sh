npm exec -c "tsc"
npm pack
cd ../test-game
npm install -D ../rbxts-transformer-fusion/rbxts-transformer-fusion-0.0.1.tgz
rm -r out
npx roblox-ts
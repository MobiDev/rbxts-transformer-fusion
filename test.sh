rm -r out
npm exec -c "tsc"
npm pack
cd ../test-game
npm uninstall rbxts-transformer-fusion
npm install -D ../rbxts-transformer-fusion/rbxts-transformer-fusion-0.1.0.tgz
rm -r out
npx roblox-ts
import https from "https"
import fs from "fs/promises"
import path from "path"

function get(url: string) {
    return new Promise<string>((resolve, reject) => {
        https.get(url, (res) => {

            let output = ''
            res.on('data', (chunk) => {
                output += chunk;
            });
            res.on("error", reject)
            res.on("end", () => {
                resolve(output)            })
        })
    })
}

async function main() {
    const latest = JSON.parse(await get('https://raw.githubusercontent.com/RobloxAPI/build-archive/master/data/production/latest.json'))
    const latestGuid = latest.GUID

    const build = JSON.parse(await get(`https://raw.githubusercontent.com/RobloxAPI/build-archive/master/data/production/builds/${latestGuid}/API-Dump.json`))
    const classes = (build.Classes as Array<any>).map((classs) => classs.Name) as string[]
    console.log(classes)

    const doubleClass: {[key: string]: string} = {}

    classes.forEach((classs) => {
        doubleClass[classs.toLowerCase()] = classs
    })
    console.log(doubleClass)
    fs.writeFile(path.join(__dirname, "classes.json"), JSON.stringify(doubleClass))
}

main()
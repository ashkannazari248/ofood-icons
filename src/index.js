const fs = require('fs')
const config = require('./config.json')
const path = __dirname
const {optimize} = require('svgo');

function pascalCase(inputString) {
    return inputString.replace(/\-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('')
}

const genarate = async () => {
    let indexJsValue = ''
    const folders = await fs.readdirSync(__dirname + '/icons/', {})
    for await (const [folderIndex, folder, c] of folders.entries()) {
        let jsFile = ''
        const files = fs.readdirSync(path + '/icons/' + folder, {withFileTypes: true})
        for await (const [fileIndex, file] of files.entries()) {
            let readFile = await fs.readFileSync(path + '/icons/' + folder + '/' + file.name, {
                encoding: 'utf8',
                flag: 'r'
            },)
            readFile = (await optimize(readFile, {
                path: file.name, // recommended
                multipass: true // all other config fields are available here
            })).data
            readFile = readFile.replace(/(^<svg[A-z\s\w\d\=:\."\/]*>|<\/svg>)/g, '')
            const newFileName = config[folder].prefix + pascalCase(file.name.replace(/\.svg/, '')).replace(/\s/g, '')
            if (config[folder].multipass) {
                readFile = readFile.replace(/\sfill="[#A-z0-9]{1,7}"/, '')
            }
            if (config[folder].onlyD) {
                const match = readFile.match(/d="([^"]*)"/)
                if (match)
                    readFile = match[1]
            }
            jsFile = jsFile.concat(`export const ${newFileName} = '${readFile}'\n`)
        }
        const newFilePatch = __dirname.replace('/src', '') + '/dist'
        fs.mkdir(newFilePatch, {recursive: true}, function (err) {
            if (!err) fs.writeFileSync(newFilePatch + '/' + config[folder].fileName.concat('.js'), jsFile, {encoding: 'utf8'});
        })
        indexJsValue = indexJsValue.concat(`export * from './${config[folder].fileName.concat('.js')}'\n`)

    }
    fs.mkdir(__dirname.replace('/src', '') + '/dist', {recursive: true}, function (err) {
        if (!err) fs.writeFileSync(__dirname.replace('/src', '') + '/dist/index.js', indexJsValue, {encoding: 'utf8'});
    })
    console.log('finish!')
}
genarate()





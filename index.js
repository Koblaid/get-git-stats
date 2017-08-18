import child_process from 'child_process'
import process from 'process'
import fs from 'fs'
import util from 'util'
import _ from 'lodash'
import moment from 'moment'

/* TODD:
- tmp file should not be created in the folder of the repository
- tmp file should be deleted afterwards
- maybe use https://www.npmjs.com/package/tmp?
 */
const execP = util.promisify(child_process.exec)
const readFileP = util.promisify(fs.readFile)
const writeFileP = util.promisify(fs.writeFile)

const log = console.log

const TMP_FILE_NAME = 'revlist.tmp'
const JSON_FILE_NAME = 'out.jsonl'

const unixTimestampToDate = ts => moment(parseInt(ts) * 1000)

const writeJsonLines = (header, lines) => writeFileP(JSON_FILE_NAME, lines.map(JSON.stringify).join('\n'))

const readJsonLines = async (filepath) => {
  const file = await readFileP(filepath, 'utf-8')
  return file.split('\n').map(row => JSON.parse(row))
}

const analyzeRepo = async () => {
  await execP(`git rev-list --pretty=format:"%H;%at;%ai;%aE;%aN" HEAD | grep -v commit > ${TMP_FILE_NAME}`)
  log('temp file written')

  const stdout = await readFileP(TMP_FILE_NAME, 'utf-8')
  const commits = _(stdout)
    .split('\n')
    .filter(line => line)
    .map(line => {
      const [commitHash, timestamp, time, email, ...name] = line.split(';')

      return {
        commitHash,
        timestamp,
        timezone: time.split(' ')[2],
        email,
        name,
      }
    })
    .value()

  await writeJsonLines(commits)
  log('The file was saved')
}

const x = async () => {
  const data = await readJsonLines(JSON_FILE_NAME)
  const years = _.countBy(data, row => unixTimestampToDate(row.timestamp).format('YYYY'))
  console.log(years)
}

const main = async () => {
  process.chdir('./repos/git')
  // await analyzeRepo()
  await x()
}

try{
  main()
} catch(e){
  console.error(e)
}

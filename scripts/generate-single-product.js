const fs = require('fs')
const path = require('path')
const slugify = require('slugify')
const crypto = require('crypto')

// 🧾 UPDATE THIS LINE to the vase you want to process
const VASE_FOLDER_NAME = 'Diamond Textured Vase'

const BASE_PATH = '/Users/saadiqmahmood/Downloads/products/vases'
const BASE_URL = 'https://gekjrxtrsqdbnijfznlj.supabase.co/storage/v1/object/public/products/vases'

const titleCase = (str) =>
  str.replace(/\w\S*/g, (txt) => txt[0].toUpperCase() + txt.slice(1).toLowerCase())

const generateSQL = () => {
  const folder = VASE_FOLDER_NAME
  const slug = slugify(folder, { lower: true })
  const title = titleCase(folder)
  const productUUID = crypto.randomUUID()
  const folderPath = path.join(BASE_PATH, folder)

  // Read description file
  const descriptionFile = fs.readdirSync(folderPath).find(f => f.endsWith('.txt'))
  const description = descriptionFile
    ? fs.readFileSync(path.join(folderPath, descriptionFile), 'utf-8').replace(/'/g, "''")
    : ''

  // Find Group.png for thumbnail
  const groupImage = fs.readdirSync(folderPath).find(f =>
    f.toLowerCase().startsWith('group') && /\.(png|jpg|jpeg)$/i.test(f)
  )
  const thumbnail = groupImage
    ? `${BASE_URL}/${encodeURIComponent(folder)}/${encodeURIComponent(groupImage)}`
    : ''

  // Product SQL
  const productSQL = `-- ${title}
INSERT INTO products (id, slug, title, description, category, thumbnail_url)
VALUES ('${productUUID}', '${slug}', '${title}', '${description}', 'Vases', '${thumbnail}');`

  // Variants (exclude DSC###.jpg and Group.png)
  const imageFiles = fs.readdirSync(folderPath).filter(file => {
    const ext = path.extname(file).toLowerCase()
    const base = path.basename(file).toLowerCase()
    return (
      (ext === '.png' || ext === '.jpg') &&
      !base.startsWith('dsc') &&
      !base.includes('group')
    )
  })

  const variantSQLs = imageFiles.map(image => {
    const color = titleCase(path.basename(image, path.extname(image)).replace(/_/g, ' '))
    const imageUrl = `${BASE_URL}/${encodeURIComponent(folder)}/${encodeURIComponent(image)}`
    return `INSERT INTO product_variants (product_id, color, image_url, price, in_stock, customizable)
VALUES ('${productUUID}', '${color}', '${imageUrl}', 14.99, true, false);`
  })

  const output = [productSQL, '', ...variantSQLs].join('\n\n')
  const outputPath = `./scripts/output/${slug}.sql`

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, output)
  console.log(`✅ SQL written to ${outputPath}`)
}

generateSQL()

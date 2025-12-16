#!/usr/bin/env node

const { createClient } = require('next-sanity')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-12-08'

if (!projectId || !dataset) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET environment variables')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, useCdn: false })

async function run() {
  try {
    const query = `*[title match "*gym*" || title match "*diet*" ]{_id, _rev, _type, title, slug, modules, module}`
    const result = await client.fetch(query)
    console.log('Found', result.length, 'matching docs')
    console.log(JSON.stringify(result, null, 2))
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

run()

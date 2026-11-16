import { defineApiHandler } from '../../utils/api'

export default defineApiHandler(event => {
  setResponseHeader(event, 'cache-control', 'public, max-age=300')
  return {
    name: 'DROP API',
    version: 'v1',
    docs: 'https://drop.micropue.com.cn/developers#api',
    openapi: 'https://drop.micropue.com.cn/v1/openapi.json'
  }
})

import openapi from '../../assets/openapi.v1.json'
import { defineApiHandler } from '../../utils/api'

export default defineApiHandler(event => {
  setResponseHeader(event, 'cache-control', 'public, max-age=300')
  return openapi
})

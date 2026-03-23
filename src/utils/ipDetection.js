import axios from 'axios'

export async function getPublicIP() {
  try {
    const response = await axios.get('https://api64.ipify.org/?format=json')
    return response.data.ip
  } catch (error) {
    console.error('Failed to get public IP:', error)
    return null
  }
}

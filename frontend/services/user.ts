import { CreateStaffForm } from "../interfaces/user";
import apiClient from '../utils/api'

export const createUser = async (data: CreateStaffForm, accessToken: string) => {
  console.log(data)
  return (await apiClient.post('/user/create', data, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }))
}
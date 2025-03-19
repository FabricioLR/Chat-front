import { createContext, ReactNode, useState } from "react"
import api from "./api"

export interface User {
    username: string
}

export interface IFormInputLogin {
    username: string
}

export interface IFormInputMessage {
    message: string
}

interface UserContextData {
    user: User | null
    LoginSubmit: (data: IFormInputLogin) => Promise<string>
    Logout: () => void
}

interface UserContextProviderProps {
    children: ReactNode
}

export const UserContext = createContext({} as UserContextData)

function UserContextProvider(props: UserContextProviderProps){
    const [ user, setUser ] = useState<User | null>(null)

    async function LoginSubmit(data: IFormInputLogin){
        try {
            const response = await api.post("/login", data)

            if (response.status == 200){
                setUser({username: response.data["username"]})
                return "success"
            }
        } catch (error: any) {
            console.log(error)
            return error.response
        }
    }

    async function Logout(){
        setUser(null)
    }

    return (
        <UserContext.Provider value={{ user, LoginSubmit, Logout }}>
            {props.children}
        </UserContext.Provider>
    )
}

export default UserContextProvider
import { useContext, useEffect, useState } from "react"
import { IFormInputLogin, IFormInputMessage, UserContext } from "../context/userContext"
import { useForm } from "react-hook-form"
import "./Home.css"
import { socket } from "../context/socket"

type Message = {
    username: string
    message: string
    type: string
}

function Home(){
    const { user, LoginSubmit, Logout } = useContext(UserContext)
    const [ messages, setMessages ] = useState<Message[]>([])
    const { register: loginregister, handleSubmit: loginhandlesubmit, formState: { errors : loginerrors } } = useForm<IFormInputLogin>()
    const { register: messageregister, handleSubmit: messagehandlesubmit, formState: { errors : messageerrors } } = useForm<IFormInputMessage>()

    useEffect(() => {
        socket.on("new_user", (data) => {
            setMessages([...messages, { username: "server", message: data.username + " acaba de entrar na conversa", type: "new_user"}])
        })
        socket.on("disconnected_user", (data) => {
            setMessages([...messages, { username: "server", message: data.username + " saiu da conversa", type: "disconnected_user"}])
        })

        socket.on("server_message", (data) => {
            setMessages([...messages, { username: data.username, message: data.message, type: "server_message"}])
        })

        socket.on("last_messages", (data: Message[]) => {
            console.log(data)
            setMessages([...messages, ...data])
        })

        return () => {
            socket.off("new_user")
            socket.off("disconnected_user")
            socket.off("server_message")
        };
        
    }, [socket, messages])

    async function onLoginSubmit(data: IFormInputLogin){
        const ret: string = await LoginSubmit(data)
        if (ret != "success"){
            alert(ret)
            return
        }

        socket.connect()
    }

    async function onMessageSubmit(data: IFormInputMessage){
        setMessages([...messages, { username: user!.username, message: data.message, type: "user_message"}])
        socket.emit("client_message", { message: data.message, username: user!.username })
    }

    window.onbeforeunload = () => {
        socket.disconnect()
        Logout()
    }

    return (
        <>
            {
                user == null ?
                    <div className="login">
                        <form className="login_form" onSubmit={loginhandlesubmit(onLoginSubmit)}>
                            <input className="login_form_input" placeholder="Username" {...loginregister("username", { required: true, maxLength: 20, minLength: 5})} aria-invalid={loginerrors.username ? "true" : "false"}/>
                            {loginerrors.username?.type === "required" && (
                                <p role="alert">Username is required</p>
                            )}
                            {loginerrors.username?.type === "maxLength" && (
                                <p role="alert">MaxLength 20</p>
                            )}
                            {loginerrors.username?.type === "minLength" && (
                                <p role="alert">MinLength 5</p>
                            )}
                            <input className="login_form_submit" type="submit" placeholder="Login"/>
                        </form>
                    </div>
                    :
                    <div className="home">
                        <div className="home_chat">
                            {
                                messages.map(message => {
                                    if (message.type == "server_message" || message.type == "user_message"){
                                        return (
                                            <div className={"message " + message.type}>
                                                <p className={"message " + message.type + " usernamep"}>{message.username}</p>
                                                <p className={"message " + message.type + " messagep"}>{message.message}</p>
                                            </div>
                                        )
                                    } else {
                                        return (
                                            <div className={"message " + message.type}>
                                                <p className={"message " + message.type + " messagep"}>{message.message}</p>
                                            </div>
                                        )
                                    }
                                })
                            }
                        </div>
                        <form className="home_message_form" onSubmit={messagehandlesubmit(onMessageSubmit)}>
                            <input className="message_form_input" placeholder="Message" {...messageregister("message", { required: true, maxLength: 500})} aria-invalid={messageerrors.message ? "true" : "false"}/>
                            <input className="message_form_submit" type="submit" placeholder="Send"/>
                        </form>
                    </div>
            }
        </>
    )
}

export default Home
import { useContext, useEffect, useRef, useState } from "react"
import { IFormInputLogin, IFormInputMessage, UserContext } from "../context/userContext"
import { useForm } from "react-hook-form"
import "./Home.css"
import { socket } from "../context/socket"

type Message = {
    username: string
    message: string
    type: string
    date: Date
}

function Home(){
    const { user, LoginSubmit, Logout } = useContext(UserContext)
    const [ messages, setMessages ] = useState<Message[]>([])
    const { register: loginregister, handleSubmit: loginhandlesubmit, formState: { errors : loginerrors }, reset: loginreset } = useForm<IFormInputLogin>()
    const { register: messageregister, handleSubmit: messagehandlesubmit, formState: { errors : messageerrors }, reset: messagereset } = useForm<IFormInputMessage>()
    const messagesEndRef = useRef<null | HTMLDivElement>(null)

    useEffect(() => {
        socket.on("new_user", (username) => {
            setMessages([...messages, { username: "server", message: username + " acaba de entrar na conversa", type: "new_user", date: new Date()}])
        })
        socket.on("disconnected_user", (username) => {
            setMessages([...messages, { username: "server", message: username + " saiu da conversa", type: "disconnected_user", date: new Date()}])
        })

        socket.on("server_message", (data) => {
            setMessages([...messages, { username: data.username, message: data.message, type: "server_message", date: data.date}])
        })

        socket.once("last_messages", (data: Message[]) => {
            console.log(data)
            setMessages([...messages, ...data])
        })

        return () => {
            socket.off("new_user")
            socket.off("disconnected_user")
            socket.off("server_message")
            socket.off("last_messages")
        };
        
    }, [socket, messages])

    async function onLoginSubmit(data: IFormInputLogin){
        const ret: string = await LoginSubmit(data)
        if (ret != "success"){
            alert(ret)
            return
        }

        loginreset()

        socket.connect()
    }

    async function onMessageSubmit(data: IFormInputMessage){
        setMessages([...messages, { username: user!.username, message: data.message, type: "user_message", date: new Date()}])
        socket.emit("client_message", { message: data.message, username: user!.username })

        messagereset()
    }

    window.onbeforeunload = () => {
        socket.disconnect()
        Logout()
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, [messages]);

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
                                    if (new Date().getDay() - new Date(message.date).getDay() > 0){
                                        <div className={"day"}>
                                            <p className={"day_messagep"}>{new Date(message.date).getDay() + "/" + new Date(message.date).getMonth() + "/" + new Date(message.date).getFullYear()}</p>
                                        </div>
                                    }
                                    if (message.type == "server_message" || message.type == "user_message"){
                                        return (
                                            <div className={message.type}>
                                                <div className={message.type + "_div"}>
                                                    <p className={message.type + "_username"}>{message.username}</p>
                                                    <p className={message.type + "_message"}>{message.message}</p>
                                                </div>
                                                <p className={message.type + "_date"}>{
                                                    new Date(message.date).getHours() + ":" + new Date(message.date).getMinutes()
                                                }</p>
                                            </div>
                                        )
                                    } else {
                                        return (
                                            <div className={message.type}>
                                                <p className={message.type + "_message"}>{message.message}</p>
                                            </div>
                                        )
                                    }
                                })
                            }
                            <div ref={messagesEndRef} />
                        </div>
                        <form className="home_message_form" onSubmit={messagehandlesubmit(onMessageSubmit)}>
                            <input className="home_message_form_input" placeholder="Message" {...messageregister("message", { required: true, maxLength: 500})} aria-invalid={messageerrors.message ? "true" : "false"}/>
                            <input className="home_message_form_submit" type="submit" placeholder="Send"/>
                        </form>
                    </div>
            }
        </>
    )
}

export default Home
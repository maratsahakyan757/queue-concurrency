import {  Message } from "./Database";

export class Queue {
    private messages: Message[]
    private inFlight: Map<string, { workerId: number, messageId: string }>

    constructor() {
        this.messages = []
        this.inFlight = new Map()
    }

    Enqueue = (message: Message) => {
        this.messages.push(message)
    }

    Dequeue = (workerId: number): Message | undefined => {
        const message = this.messages.find(m => !this.inFlight.has(m.key))
        if (!message) {
            return undefined
        }
        this.inFlight.set(message.key, { workerId, messageId: message.id })
        return message
    }

    Confirm = (workerId: number, messageId: string) => {
        const index = this.messages.findIndex(m => m.id === messageId)
        if (index === -1) {
            return
        }
        const key = this.messages[index].key
        const lock = this.inFlight.get(key)
        if (!lock || lock.workerId !== workerId || lock.messageId !== messageId) {
            return
        }
        this.messages.splice(index, 1)
        this.inFlight.delete(key)
    }

    Size = () => {
        return this.messages.length
    }
}


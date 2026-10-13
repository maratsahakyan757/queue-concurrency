import {  Message } from "./Database";

type Node = {
    message: Message
    next?: Node
}

type KeyQueue = {
    first: Node
    last: Node
    busy: boolean
}

type Owner = {
    key: string
    workerId: number
}

export class Queue {
    private queues: Map<string, KeyQueue>
    private freeKeys: Set<string>
    private taken: Map<string, Owner>
    private size: number

    constructor() {
        this.queues = new Map()
        this.freeKeys = new Set()
        this.taken = new Map()
        this.size = 0
    }

    Enqueue = (message: Message) => {
        const node: Node = { message }
        let queue = this.queues.get(message.key)
        if (queue) {
            queue.last.next = node
            queue.last = node
        } else {
            queue = { first: node, last: node, busy: false }
            this.queues.set(message.key, queue)
        }
        this.size++
        if (!queue.busy) {
            this.freeKeys.add(message.key)
        }
    }

    Dequeue = (workerId: number): Message | undefined => {
        const key = this.freeKeys.values().next().value
        if (key === undefined) {
            return undefined
        }
        this.freeKeys.delete(key)
        const queue = this.queues.get(key)!
        const message = queue.first.message
        queue.busy = true
        this.taken.set(message.id, { key, workerId })
        return message
    }

    Confirm = (workerId: number, messageId: string): boolean => {
        const owner = this.giveBack(workerId, messageId)
        if (!owner) {
            return false
        }
        const queue = this.queues.get(owner.key)!
        this.size--
        if (queue.first.next) {
            queue.first = queue.first.next
            this.freeKeys.add(owner.key)
        } else {
            this.queues.delete(owner.key)
        }
        return true
    }

    Release = (workerId: number, messageId: string): boolean => {
        const owner = this.giveBack(workerId, messageId)
        if (!owner) {
            return false
        }
        this.freeKeys.add(owner.key)
        return true
    }

    Size = () => {
        return this.size
    }

    private giveBack = (workerId: number, messageId: string): Owner | undefined => {
        const owner = this.taken.get(messageId)
        if (!owner || owner.workerId !== workerId) {
            return undefined
        }
        this.taken.delete(messageId)
        this.queues.get(owner.key)!.busy = false
        return owner
    }
}


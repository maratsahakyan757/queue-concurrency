# Explanation

The problem is in Database.set. It reads the value, waits, and then writes. If two workers do this for the same key at the same time, one write replaces the other and some updates are lost.

My fix is in Queue.ts. The queue gives out only one message per key at a time. Dequeue returns the first message whose key is not busy. Confirm removes the message and makes the key free again. This keeps the order for each key and SET always runs before ADD.

## Version 2

The real bug is in Database.set, not in the queue. The right fix is one atomic update, like a transaction or INCR. The lock in the queue is a workaround, but only Queue.ts may change, so I did it there.

The first version searched the whole list on every Dequeue and Confirm. For 33 messages it is fine, for 40,000 one run took almost a second. Now each key has its own seperate list, there is a list of free keys, and a map from message id to the worker that holds it. Every operation is one step. The same 40,000 messages take about 30 ms. Free keys are served in the order they became free, so one busy key can not block the others. A finished message is removed at once.

Release is used when a worker fails to do a message. It gives the message back to the queue, at the front of its key, and opens the key again. The next worker gets the same message first, so nothing is skipped and the order is kept. A Confirm or Release from a worker wich does not hold the message is ignored and returns false. This is normal, for example after a timeout gave the message to another worker. Note that a retry can run a job twice, so the work must be safe to repeat. A real system would also need a retry limit, a dead letter list and a timeout for crashed workers.

Worker.ts should catch errors and call Release, and wait when all keys are busy instead of stopping. main.ts should await the workers instead of sleep. Message ids should use crypto.randomUUID.

This works in one process only. With more processes you need a real broker, like SQS FIFO, Kafka or Redis.

# Explanation

The problem is in Database.set. It reads the value, waits, and then writes. If two workers do this for the same key at the same time, one write replaces the other and some updates are lost.

My fix is in Queue.ts. The queue gives out only one message per key at a time. Dequeue returns the first message whose key is not busy. Confirm removes the message and makes the key free again. This keeps the order for each key and SET always runs before ADD.

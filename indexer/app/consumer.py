from kafka import KafkaConsumer
from elasticsearch import Elasticsearch
import json


class Consumer:
    def __init__(self, topic) -> None:
        self._consumer = KafkaConsumer(
            topic,
            bootstrap_servers="localhost:9092",
            value_deserializer=lambda x: json.loads(x.decode('utf-8')),
            group_id='nflx'
        )
        self._es_client = Elasticsearch("http://localhost:9200")
        self._es_client.info()

    @property
    def consumer(self):
        return self._consumer

    @consumer.setter
    def consumer(self, value):
        if isinstance(value, KafkaConsumer):
            self._consumer = value

    def start_read(self):
        self.receive_message()

    def receive_message(self):
        message_count = 0
        print("Listening kafka messages...")
        for message in self._consumer:
            message = message.value
            print(f"Message {message_count}: {message}")
            message_count += 1
            self._es_client.index(
                index=message["index"] or "posts",
                id=message["id"],
                document={
                    "title": message["title"],
                    "content": message["content"],
                    "author": message["author"],
                    "published_date": message["publishedDate"]
                }
            )

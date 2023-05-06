#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <WiFiClient.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <cstring>


#define DHTPIN D1
#define DHTTYPE DHT22
#define RELAYPIN D8

const char *ssid = "";
const char *password = "";
const char *server = "192.168.x.x";
const uint16_t port = 3001;

DHT dht(DHTPIN, DHTTYPE);
ESP8266WiFiMulti WiFiMulti;
WebSocketsClient webSocket;

void setup() {
  Serial.begin(9600);
  pinMode(RELAYPIN, OUTPUT);
  dht.begin();

  delay(4000);
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);

  WiFiMulti.addAP(ssid, password);

  int retries = 0;
  while (WiFiMulti.run() != WL_CONNECTED) {
    retries++;
    Serial.print("Attempt ");
    Serial.print(retries);
    Serial.println("...");
    delay(1000);
  }

  Serial.println("Wi-Fi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  webSocket.begin(server, port, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(3000);
}


void loop() {
  webSocket.loop();
}

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[WSc] Disconnected!\n");
      break;
    case WStype_CONNECTED:
      Serial.printf("[WSc] Connected to url: %s\n", payload);
      break;
    case WStype_TEXT:
      Serial.printf("[WSc] Received text: %s\n", payload);

      if (strcmp(reinterpret_cast<const char*>(payload), "request_data") == 0) {

        {
          Serial.println("Reading data from dht22 and sending to server");
          float humidity = dht.readHumidity();
          float temperature = dht.readTemperature();
          float temperatureF = (temperature * 1.8 + 32);

         if (isnan(humidity) || isnan(temperature)) {
            Serial.println("Failed to read from DHT sensor!");
            return;
         }

          StaticJsonDocument<128> json;
          json["temperature"] = round(temperatureF * 10.0) / 10.0;
          json["humidity"] = round(humidity * 10.0) / 10.0;

         String message;
          serializeJson(json, message);

          webSocket.sendTXT(message);
        }
      }

      
      
      break;
    case WStype_BIN:
      Serial.printf("[WSc] Received binary length: %u\n", length);
      break;
    case WStype_ERROR:
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_FIN:
      break;
  }
}

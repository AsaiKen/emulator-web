# android emulatorをwebで動かす

## インストール

```
$ npm i
$ ./node_modules/.bin/grpc_tools_node_protoc --include_imports --include_source_info --proto_path ./proto --descriptor_set_out gen/api_descriptor.pb --js_out=import_style=commonjs,binary:gen/ --grpc_out=grpc_js:gen/ ./proto/emulator_controller.proto ./proto/rtc_service.proto
```

## 起動

エミュレータ
```
$ sdkmanager --sdk_root=$ANDROID_SDK_ROOT platform-tools emulator
$ sdkmanager --sdk_root=$ANDROID_SDK_ROOT "platforms;android-30" "system-images;android-30;google_apis_playstore;x86_64" "build-tools;30.0.2"
$ avdmanager create avd -n "my_avd_30" -k "system-images;android-30;google_apis_playstore;x86_64"
$ emulator -avd "my_avd_30" -grpc 5556
```

node
```
$ node server.js
```

## 参考

https://github.com/google/android-emulator-webrtc

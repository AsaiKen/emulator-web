# android emulatorをwebで動かす

## インストール

エミュレータ
```
$ emulator -avd <AVD_NAME> -grpc 5556
```

node
```
$ npm i
$ ./node_modules/.bin/grpc_tools_node_protoc --include_imports --include_source_info --proto_path ./proto --descriptor_set_out gen/api_descriptor.pb --js_out=import_style=commonjs,binary:gen/ --grpc_out=grpc_js:gen/ ./proto/emulator_controller.proto ./proto/rtc_service.proto
```

## 参考

https://github.com/google/android-emulator-webrtc

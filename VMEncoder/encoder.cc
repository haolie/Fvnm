// addon.cc
#include < node.h >
#include <v8.h>
#include <node_buffer.h>

using namespace node;
using namespace v8;
using namespace std;


namespace demo {

    using v8::Function;
    using v8::FunctionCallbackInfo;
    using v8::FunctionTemplate;
    using v8::Isolate;
    using v8::Local;
    using v8::Object;
    using v8::String;
    using v8::Value;
    using v8::Array;
    using v8::Uint8Array;
    using v8::Integer;
    using v8::Number;


    void MyFunction(const FunctionCallbackInfo < Value > &args) {
        Isolate * isolate = args.GetIsolate();
        Local<Value> arg1 = args[0];
       size_t size = Buffer::Length(arg1->ToObject());
       char* bufferdata = Buffer::Data(arg1->ToObject());

 //Local<Uint8Array> input_array = Local<Uint8Array>::Cast(args[0]);
 //int len=input_array->Length();
int row_index;
unsigned char temp;
	//Local<Uint8Array> dataArray=Uint8Array::New(Array::New(isolate,len));
    Local<Array> dataArray=Array::New(isolate,size);
	for(row_index=0;row_index<size;row_index++){
	  // temp=input_array->Get(row_index)->NumberValue();
	  temp=bufferdata[row_index];
	//   temp+=1;
	   temp= ~temp ;
	   dataArray->Set(Integer::New(isolate,row_index),Integer::New(isolate,temp));
	}
args.GetReturnValue().Set(dataArray);

        //args.GetReturnValue().Set(String::NewFromUtf8(isolate, "hello world"));
    }

    void CreateFunction(const FunctionCallbackInfo < Value > &args) {
        Isolate * isolate = args.GetIsolate();

        Local < FunctionTemplate > tpl = FunctionTemplate::New(isolate, MyFunction);
        Local < Function > fn = tpl ->GetFunction();

        // omit this to make it anonymous
        fn ->SetName(String::NewFromUtf8(isolate, "theFunction"));

        args.GetReturnValue().Set(fn);
    }

    void Init(Local < Object > exports, Local < Object > module) {
        NODE_SET_METHOD(module, "exports", CreateFunction);
    }

    NODE_MODULE(addon, Init)

} // namespace demo
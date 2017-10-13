// addon.cc
#include < node.h >

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
    using v8::Integer;
    using v8::Number;

    void MyFunction(const FunctionCallbackInfo < Value > &args) {
        Isolate * isolate = args.GetIsolate();
//
//        int row_index=args[0]->NumberValue();
//
//        Local<Array> input_array = Local<Array>::Cast(args[3]);
//
//        printf("%d\n", row_index);
//        Local<Integer> integer = args[1]->ToInteger();
//         	Local<Array> dataArray=Array::New(isolate,3);
//        	for(row_index=0;row_index<3;row_index++) {
//
//        Local<Value> cell=Number::New(isolate,args[row_index]->NumberValue()+2);
//        	dataArray->Set(Integer::New(isolate,row_index),cell);
//
//        	  	}
//args.GetReturnValue().Set(input_array);


 Local<Array> input_array = Local<Array>::Cast(args[0]);
 int len=input_array->Length();
int row_index;
unsigned char temp;
	Local<Array> dataArray=Array::New(isolate,len);

	for(row_index=0;row_index<len;row_index++){
	   temp=input_array->Get(row_index)->NumberValue();
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
import { ApiResponse as ApiResponseInterface } from "@/interface/interface";

class ApiResponse implements ApiResponseInterface{
    statusCode: number;
    message: string;
    data: any;
    success: boolean;
    constructor(stacode:number,message:string,data:any,success:boolean){
        this.statusCode = stacode;
        this.message = message;
        this.data = data;
        this.success = success;
    }
}

export {ApiResponse}
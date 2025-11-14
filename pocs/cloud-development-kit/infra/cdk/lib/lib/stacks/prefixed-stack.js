"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefixedCdkStack = void 0;
const cdk = require("aws-cdk-lib");
class PrefixedCdkStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.appName = props.appName;
        this.prefix = `${props.appName}-${props.prefix}`;
    }
}
exports.PrefixedCdkStack = PrefixedCdkStack;

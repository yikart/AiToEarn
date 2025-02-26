/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

ProtocolTestHarness = class ProtocolTestHarness extends TestHarness
{
    // TestHarness Overrides

    completeTest()
    {
        if (this.dumpActivityToSystemConsole)
            InspectorFrontendHost.unbufferedLog("completeTest()");

        this.evaluateInPage("TestPage.closeTest();");
    }

    addResult(message)
    {
        let stringifiedMessage = TestHarness.messageAsString(message);

        if (this.dumpActivityToSystemConsole)
            InspectorFrontendHost.unbufferedLog(stringifiedMessage);

        // Unfortunately, every string argument must be escaped because tests are not consistent
        // with respect to escaping with single or double quotes. Some exceptions use single quotes.
        this.evaluateInPage(`TestPage.log(unescape("${escape(stringifiedMessage)}"));`);
    }

    debugLog(message)
    {
        let stringifiedMessage = TestHarness.messageAsString(message);

        if (this.dumpActivityToSystemConsole)
            InspectorFrontendHost.unbufferedLog(stringifiedMessage);

        this.evaluateInPage(`TestPage.debugLog(unescape("${escape(stringifiedMessage)}"));`);
    }

    evaluateInPage(expression, callback)
    {
        let args = {
            method: "Runtime.evaluate",
            params: {expression}
        };

        if (typeof callback === "function")
            InspectorProtocol.sendCommand(args, callback);
        else
            return InspectorProtocol.awaitCommand(args);
    }

    debug()
    {
        this.dumpActivityToSystemConsole = true;
        this.dumpInspectorProtocolMessages = true;
    }
};

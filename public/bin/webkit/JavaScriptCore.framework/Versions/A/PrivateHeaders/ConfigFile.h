/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <limits.h>

namespace JSC {

class ConfigFile {
public:
    JS_EXPORT_PRIVATE ConfigFile(const char*);

    JS_EXPORT_PRIVATE static void setProcessName(const char*);
    JS_EXPORT_PRIVATE static void setParentProcessName(const char*);
    JS_EXPORT_PRIVATE void parse();

private:
    void canonicalizePaths();

#if OS(WINDOWS)
    static const size_t s_maxPathLength = 260; // Windows value for "MAX_PATH"
#elif defined(PATH_MAX)
    static const size_t s_maxPathLength = PATH_MAX;
#else
    static const size_t s_maxPathLength = 4095;
#endif

    static char s_processName[];
    static char s_parentProcessName[];

    char m_filename[s_maxPathLength + 1];
    char m_configDirectory[s_maxPathLength + 1];
};

JS_EXPORT_PRIVATE void processConfigFile(const char* configFile, const char* processName, const char* parentProcessName = nullptr);

} // namespace JSC

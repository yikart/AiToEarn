/*
 * Copyright (C) 2012-2023 Apple Inc. All rights reserved.
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

#include "JSCJSValue.h"
#include "ProfilerBytecodes.h"
#include "ProfilerCompilation.h"
#include "ProfilerEvent.h"
#include <wtf/HashMap.h>
#include <wtf/JSONValues.h>
#include <wtf/Lock.h>
#include <wtf/Noncopyable.h>
#include <wtf/SegmentedVector.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/WTFString.h>

namespace JSC { namespace Profiler {

struct DatabaseIDType;
using DatabaseID = AtomicObjectIdentifier<DatabaseIDType>;

class Database {
    WTF_MAKE_TZONE_ALLOCATED(Database);
    WTF_MAKE_NONCOPYABLE(Database);
public:
    JS_EXPORT_PRIVATE Database(VM&);
    JS_EXPORT_PRIVATE ~Database();

    DatabaseID databaseID() const { return m_databaseID; }
    
    Bytecodes* ensureBytecodesFor(CodeBlock*);
    void notifyDestruction(CodeBlock*);
    
    void addCompilation(CodeBlock*, Ref<Compilation>&&);

    // Converts the database to a JSON object that is suitable for JSON stringification.
    JS_EXPORT_PRIVATE Ref<JSON::Value> toJSON() const;

    // Saves the JSON representation (from toJSON()) to the given file. Returns false if the
    // save failed.
    JS_EXPORT_PRIVATE bool save(const char* filename) const;

    void registerToSaveAtExit(const char* filename);
    
    JS_EXPORT_PRIVATE void logEvent(CodeBlock* codeBlock, const char* summary, const CString& detail);
    
private:
    Bytecodes* ensureBytecodesFor(const AbstractLocker&, CodeBlock*);
    
    void addDatabaseToAtExit();
    void removeDatabaseFromAtExit();
    void performAtExitSave() const;
    static Database* removeFirstAtExitDatabase();
    static void atExitCallback();
    
    DatabaseID m_databaseID;
    VM& m_vm;
    SegmentedVector<Bytecodes> m_bytecodes;
    UncheckedKeyHashMap<CodeBlock*, Bytecodes*> m_bytecodesMap;
    Vector<Ref<Compilation>> m_compilations;
    UncheckedKeyHashMap<CodeBlock*, Ref<Compilation>> m_compilationMap;
    Vector<Event> m_events;
    bool m_shouldSaveAtExit;
    CString m_atExitSaveFilename;
    Database* m_nextRegisteredDatabase;
    Lock m_lock;
};

} } // namespace JSC::Profiler

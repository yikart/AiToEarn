/*
 * Copyright (C) 2009 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef SQLiteFileSystem_h
#define SQLiteFileSystem_h

#include <wtf/WallTime.h>
#include <wtf/text/WTFString.h>

struct sqlite3;

namespace WebCore {

class SQLiteDatabase;

// A class that abstracts the file system related operations required
// by the WebKit database code.
class SQLiteFileSystem {
public:
    // Creates an absolute file path given a directory and a file name.
    //
    // path - The directory.
    // fileName - The file name.
    WEBCORE_EXPORT static String appendDatabaseFileNameToPath(StringView path, StringView fileName);

    // Makes sure the given directory exists, by creating all missing directories
    // on the given path.
    //
    // path - The directory.
    WEBCORE_EXPORT static bool ensureDatabaseDirectoryExists(const String& path);

    // If 'checkPathOnly' is false, then this method only checks if the given file exists.
    // If 'checkPathOnly' is true, then this method makes sure all directories on the
    // given path exist by creating the missing ones, and does not check if the file
    // itself exists.
    //
    // Sometimes we expect a DB file to exist; other times, we're OK with creating a new
    // DB file, but we want to make sure that the directory in which we want to put the
    // new DB file exists. This method covers both cases.
    //
    // fileName - The file name.
    // checkPathOnly - If true, we only make sure that the given directory exists.
    //                 If false, we only check if the file exists.
    static bool ensureDatabaseFileExists(const String& fileName, bool checkPathOnly);

    // Deletes an empty database directory.
    //
    // path - The directory.
    static bool deleteEmptyDatabaseDirectory(const String& path);

    // Deletes a database file.
    //
    // fileName - The file name.
    WEBCORE_EXPORT static bool deleteDatabaseFile(const String& filePath);

#if PLATFORM(COCOA)
    static void setCanSuspendLockedFileAttribute(const String& filePath);
#endif

    // Moves a database file to a new place.
    WEBCORE_EXPORT static bool moveDatabaseFile(const String& oldFilePath, const String& newFilePath);
    WEBCORE_EXPORT static String computeHashForFileName(StringView filePath);

#if PLATFORM(COCOA)
    // Truncates a database file. Used when MobileSafariSettings deletes a database file,
    // since deleting the file nukes the POSIX file locks which would potentially cause Safari
    // to corrupt the new db if it's running in the background.
    static bool truncateDatabaseFile(sqlite3* database);
#endif
    
    WEBCORE_EXPORT static uint64_t databaseFileSize(const String& fileName);
    WEBCORE_EXPORT static std::optional<WallTime> databaseCreationTime(const String& fileName);
    WEBCORE_EXPORT static std::optional<WallTime> databaseModificationTime(const String& fileName);

private:
    // do not instantiate this class
    SQLiteFileSystem();
}; // class SQLiteFileSystem

} // namespace WebCore

#endif

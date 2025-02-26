#!/bin/sh -e

# Decompresses and copies PGO profiles from WebKitAdditions to a derived folder.

if [ "${CLANG_USE_OPTIMIZATION_PROFILE}" = YES ]; then
    eval $(stat -s "${SCRIPT_INPUT_FILE_0}")
    if [ ${st_size} -lt 1024 ]; then
        if [ "${CONFIGURATION}" = Production ]; then
            echo "error: ${SCRIPT_INPUT_FILE_0} is <1KB, is it a Git LFS stub?"\
                "Ensure this file was checked out on a machine with git-lfs installed."
            exit 1
        else
            echo "warning: ${SCRIPT_INPUT_FILE_0} is <1KB, is it a Git LFS stub?"\
                "To build with production optimizations, ensure this file was checked out on a machine with git-lfs installed."\
                "Falling back to stub profile data."
            cp -vf "${SCRIPT_INPUT_FILE_1}" "${SCRIPT_OUTPUT_FILE_0}"
        fi
    else
        compression_tool -v -decode -i "${SCRIPT_INPUT_FILE_0}" -o "${SCRIPT_OUTPUT_FILE_0}"
    fi
fi

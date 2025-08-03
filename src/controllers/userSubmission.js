const Problem = require("../models/problem");
const Submission = require("../models/submission");
const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");

const submitCode = async (req, res) => {
    try {
        // --- 1. VALIDATE INCOMING DATA ---
        const problemId = req.params.id;
        const { code, language } = req.body;
        const user = req.result || req.user;
        // console.log(language)

        if (!user || !user._id) {
            console.error("Authentication error: User ID not found in request.");
            return res.status(401).json({ success: false, message: "Authentication error: User not identified." });
        }
        const userId = user._id;

        if (!code || !language || !problemId) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // --- 2. FETCH PROBLEM AND PREPARE TEST CASES ---
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem not found." });
        }

        // ** THE FIX **: Safely combine both visible and hidden test cases
        const visibleTestCases = Array.isArray(problem.visibleTestCases) ? problem.visibleTestCases : [];
        const hiddenTestCases = Array.isArray(problem.hiddenTestCases) ? problem.hiddenTestCases : [];
        const allTestCases = [...visibleTestCases, ...hiddenTestCases];

        if (allTestCases.length === 0) {
            return res.status(400).json({ success: false, message: "No test cases found for this problem." });
        }

        // --- 3. SUBMIT TO JUDGE0 ---
        const languageId = getLanguageById(language);
        if (!languageId) {
            return res.status(400).json({ success: false, message: `Unsupported language: ${language}` });
        }

        const batchPayload = allTestCases.map((testcase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output,
        }));
        
        const submissionTokens = await submitBatch(batchPayload);
        const tokens = submissionTokens.map((value) => value.token);
        // console.log(tokens)
        const testResults = await submitToken(tokens);

        // --- 4. PROCESS RESULTS ---
        let passedCount = 0;
        let totalRuntime = 0;
        let maxMemory = 0;
        let finalStatus = 'accepted';
        let finalErrorMessage = null;

        for (const result of testResults) {
            // Judge0 status for "Accepted" is 3
            // console.log(result.status_id)
            if (result.status_id === 3 || result.status?.id === 3) {
                passedCount++;
                totalRuntime += parseFloat(result.time || 0);
                maxMemory = Math.max(maxMemory, result.memory || 0);
            } else {
                // If this is the first failure, set the final status and error message
                if (finalStatus === 'accepted') {
                    const statusDescription = result.status?.description || 'Error';
                    finalStatus = statusDescription.replace(/ /g, '_').toLowerCase();
                    finalErrorMessage = result.stderr || result.compile_output || `Failed on a hidden test case.`;
                }
            }
        }
        
        // --- 5. SAVE SUBMISSION TO DATABASE ---
        // Create and save the submission in one go after processing
        const finalSubmission = await Submission.create({
            userId,
            problemId,
            code,
            language,
            status: finalStatus,
            testCasesTotal: allTestCases.length,
            testCasesPassed: passedCount,
            errorMessage: finalErrorMessage,
            runtime: totalRuntime,
            memory: maxMemory,
            // Optionally store the detailed results for history
            results: { testCases: testResults }
        });

        // --- 6. UPDATE USER'S SOLVED LIST IF ACCEPTED ---
        if (finalStatus === 'accepted' && !user.problemSolved.includes(problemId)) {
            user.problemSolved.push(problemId);
            await user.save();
        }

        // --- 7. SEND FINAL RESPONSE TO FRONTEND ---
        // This structure matches what the UI component now expects
        res.status(200).json({
            success: finalStatus === 'accepted',
            status: finalStatus,
            testCases: testResults,
            runtime: totalRuntime,
            memory: maxMemory,
            errorMessage: finalErrorMessage
        });

    } catch (err) {
        console.error("--- UNHANDLED ERROR IN submitCode ---", err);
        res.status(500).json({
            success: false,
            status: "server_error",
            errorMessage: "An internal server error occurred.",
            error: err.message // Keep the original error for debugging if needed
        });
    }
};

const runCode = async (req, res) => {
    try {
        const problemId = req.params.id;
        const { code, language } = req.body;
        const user = req.result || req.user;
        // console.log(language)

        if (!user || !user._id) {
            console.error("Authentication error: User ID not found in request.");
            return res.status(401).json({ success: false, message: "Authentication error: User not identified." });
        }
        const userId = user._id;

        if (!code || !language || !problemId) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // --- 2. FETCH PROBLEM AND PREPARE TEST CASES ---
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem not found." });
        }

        // ** THE FIX **: Safely combine both visible and hidden test cases
        const visibleTestCases = Array.isArray(problem.visibleTestCases) ? problem.visibleTestCases : [];
        const hiddenTestCases = Array.isArray(problem.hiddenTestCases) ? problem.hiddenTestCases : [];
        const allTestCases = [...visibleTestCases, ...hiddenTestCases];

        if (allTestCases.length === 0) {
            return res.status(400).json({ success: false, message: "No test cases found for this problem." });
        }

        // --- 3. SUBMIT TO JUDGE0 ---
        const languageId = getLanguageById(language);
        if (!languageId) {
            return res.status(400).json({ success: false, message: `Unsupported language: ${language}` });
        }

        const batchPayload = allTestCases.map((testcase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output,
        }));
        
        const submissionTokens = await submitBatch(batchPayload);
        const tokens = submissionTokens.map((value) => value.token);
        // console.log(tokens)
        const testResults = await submitToken(tokens);

        // --- 4. PROCESS RESULTS ---
        let passedCount = 0;
        let totalRuntime = 0;
        let maxMemory = 0;
        let finalStatus = 'accepted';
        let finalErrorMessage = null;

        for (const result of testResults) {
            // Judge0 status for "Accepted" is 3
            // console.log(result.status_id)
            if (result.status_id === 3 || result.status?.id === 3) {
                passedCount++;
                totalRuntime += parseFloat(result.time || 0);
                maxMemory = Math.max(maxMemory, result.memory || 0);
            } else {
                // If this is the first failure, set the final status and error message
                if (finalStatus === 'accepted') {
                    const statusDescription = result.status?.description || 'Error';
                    finalStatus = statusDescription.replace(/ /g, '_').toLowerCase();
                    finalErrorMessage = result.stderr || result.compile_output || `Failed on a hidden test case.`;
                }
            }
        }
        // --- Step 5: Send the new, structured response to the frontend ---
        res.status(200).json({
            success: finalStatus === 'accepted',
            testCases: testResults, // <-- CHANGE HERE (send the whole array)
            runtime: totalRuntime,
            memory: maxMemory,
            errorMessage: finalErrorMessage
        });

    } catch (err) {
        console.error("SERVER RUNCODE ERROR:", err);
        res.status(500).json({
            success: false,
            testCases: [],
            errorMessage: "Internal Server Error: " + err.message
        });
    }
};

module.exports = {submitCode,runCode};



//     language_id: 54,
//     stdin: '2 3',
//     expected_output: '5',
//     stdout: '5',
//     status_id: 3,
//     created_at: '2025-05-12T16:47:37.239Z',
//     finished_at: '2025-05-12T16:47:37.695Z',
//     time: '0.002',
//     memory: 904,
//     stderr: null,
//     token: '611405fa-4f31-44a6-99c8-6f407bc14e73',
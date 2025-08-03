const Problem=require('../models/problem')
const User=require("../models/user")
const Submission = require("../models/submission");
const {getLanguageById,submitBatch,submitToken}=require('../utils/problemUtility')

const createProblem=async (req,res)=>{
    console.log('hello')
    const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCreator
    } = req.body;
    // console.log(req.body)

    try{
         
        for(const {language,completeCode} of referenceSolution){
            const languageId=getLanguageById(language);
           
            //  console.log('Language from frontend:', language, '| Mapped ID:', languageId);
            // console.log(languageId)
            const submissions=visibleTestCases.map((value)=>({
                 source_code:completeCode,
                 language_id: languageId,
                 stdin: value.input,
                 expected_output: value.output
            }))
            // console.log(submissions)
            const submitResult = await submitBatch(submissions);

            
            // console.log("1")
            const resultToken = submitResult.map((value)=> value.token);

            // console.log(resultToken)

            const testResult =await submitToken(resultToken);

            // console.log(testResult)
            // console.log("1")

            for (const test of testResult) {
        // Check if the test case is NOT "Accepted" (status_id 3 is the standard for Judge0)
                for (const test of testResult) {
                if (test.status_id !== 3) { // 3 means "Accepted"
                    // THIS BLOCK IS PROBABLY RUNNING
                    console.error("!!! TEST CASE VERIFICATION FAILED !!!");
                    const errorMessage = `Reference solution failed with status: '${test.status.description}'. ...`;
                    return res.status(400).json({ // This sends the 400 error
                        message: errorMessage,
                        details: { // And this is the object you are receiving
                            status: test.status.description,
                            stdout: test.stdout,
                            stderr: test.stderr,
                        }
                    });
                }
                }    
                 
         
            }
                  }
                  await Problem.create({
                     ...req.body,
                     problemCreator: req.result._id
                 });
                     res.status(201).json({
            message:"problem is created successfully"
        })
    }
    catch (err) {
        res.status(400).json({
            message:`Error: ${err.message}`
        })
    }
}

const updateProblem = async (req,res)=>{
    
  const {id} = req.params;
  const {title,description,difficulty,tags,
    visibleTestCases,hiddenTestCases,startCode,
    referenceSolution, problemCreator
   } = req.body;

  try{

     if(!id){
      return res.status(400).send("Missing ID Field");
     }

    const DsaProblem =  await Problem.findById(id);
    if(!DsaProblem)
    {
      return res.status(404).send("ID is not persent in server");
    }
      
    for(const {language,completeCode} of referenceSolution){
         

      // source_code:
      // language_id:
      // stdin: 
      // expectedOutput:

      const languageId = getLanguageById(language);
        
      // I am creating Batch submission
      const submissions = visibleTestCases.map((testcase)=>({
          source_code:completeCode,
          language_id: languageId,
          stdin: testcase.input,
          expected_output: testcase.output
      }));


      const submitResult = await submitBatch(submissions);
      // console.log(submitResult);

      const resultToken = submitResult.map((value)=> value.token);

      // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
      
     const testResult = await submitToken(resultToken);

    //  console.log(testResult);

     for(const test of testResult){
      if(test.status_id!=3){
       return res.status(400).send("Error Occured");
      }
     }

    }


  const newProblem = await Problem.findByIdAndUpdate(id , {...req.body}, {runValidators:true, new:true});
   
  res.status(200).send(newProblem);
  }
  catch(err){
      res.status(500).send("Error: "+err);
  }
}
const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send("Successfully Deleted");
  }
  catch(err){
     
    res.status(500).send("Error: "+err);
  }
}
// const getProblemById = async(req,res)=>{

//   const {id} = req.params;
//   try{
     
//     if(!id)
//       return res.status(400).send("ID is Missing");

//     const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution ');
   
//    if(!getProblem)
//     return res.status(404).send("Problem is Missing");


//    res.status(200).send(getProblem);
//   }
//   catch(err){
//     res.status(500).send("Error: "+err);
//   }
// }

const getProblemById = async (req, res) => {
    
    let { by, value } = req.query;
  
    // Check if 'by' exists before trying to modify it
    if (!by) {
        return res.status(400).send("The 'by' parameter is missing.");
    }

    // --- SOLUTION ---
    // Clean up the input to make the check robust
    const cleanBy = by.trim().toLowerCase();
    
    let get_by = undefined;

    if (cleanBy === "id") {
        get_by = { _id: value };
    }
    else if (cleanBy === "name") {
        get_by = { title: value };
    }
    else if (by === "serial") {
        // --- THE FIX IS HERE ---
        // Convert the string from the URL into an integer before querying.
        const serialNumber = parseInt(value, 10);
        
        // Add a check to ensure the conversion was successful
        if (isNaN(serialNumber)) {
            return res.status(400).send("Invalid serial number format.");
        }
        
        get_by = { serial_number: serialNumber };
    }
    
    else {
        // This 'else' will now only trigger if the value is truly invalid
        return res.status(400).send("Invalid 'by' value. Use 'id', 'name', or 'serial'.");
    }

    try {
        // ... rest of your code remains the same
        const getProblem = await Problem.findOne(get_by).select(" -problem_created_by");

        if (!getProblem)
            return res.status(404).send("Problem is Missing");

        res.status(200).send(getProblem);

    } catch (err) {
    // THIS WILL SHOW THE REAL ERROR IN YOUR NODE.JS CONSOLE
    console.error("INTERNAL SERVER ERROR:", err); 
    
    res.status(500).send("An internal server error occurred.");
}
}
const getAllProblem = async(req,res)=>{

  try{
     
    const getProblem = await Problem.find({}).select('_id title difficulty tags serial_number');

   if(getProblem.length==0)
    return res.status(404).send("Problem is Missing");


   res.status(200).json(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}
const solvedAllProblembyUser =  async(req,res)=>{
     
    try{
      //  console.log("hg")
      // const count=req.result.problemSolved.length;
      // console.log(count)
      // res.status(200).send(count);
      const userId = req.result?._id;
      

      const user =  await User.findById(userId).populate({
        path:"problemSolved",
        select:"_id title difficulty tags serial_number"
      });
      
      res.status(200).json(user.problemSolved);

    }
    catch (err) {
        // CRITICAL: This will now log the real error to your terminal
        
        
        res.status(500).json({ message: "Server Error" });
    }
}
const submittedProblem = async (req, res) => {
    try {

        const userId = req.result._id;
        const problemId = req.params.pid;

        const submissions = await Submission.find({ userId, problemId })
                                            .sort({ createdAt: -1 })
                                            .lean();

        if (submissions.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No Submissions Yet",
                submissions: []
            });
        }

        const detailed_submissions = submissions.map(sub => {
            // --- Defensive/Safe Value Formatting ---

            // Safely format runtime
            const runtimeValue = Number(sub.runtime || 0);
            const formattedRuntime = !isNaN(runtimeValue) ? `${runtimeValue.toFixed(4)}s` : "N/A";
            
            // Safely format memory
            const memoryValue = Number(sub.memory || 0);
            const formattedMemory = !isNaN(memoryValue) ? `${memoryValue} KB` : "N/A";

            return {
                submission_id: sub._id,
                language: sub.language,
                code: sub.code,
                status: sub.status,
                testcases_passed: `${sub.testCasesPassed || 0}/${sub.testCasesTotal || 0}`,
                runtime: formattedRuntime, // Use the safe, formatted value
                memory: formattedMemory,   // Use the safe, formatted value
                submitted_at: sub.createdAt,
                error_message: sub.errorMessage,
            };
        });

        res.status(200).json({
            success: true,
            submissions: detailed_submissions
        });

    } catch (err) {
        // Log the actual error to your console for easier debugging in the future
        console.error("CRASH in submittedProblem controller:", err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
};

module.exports={createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem};
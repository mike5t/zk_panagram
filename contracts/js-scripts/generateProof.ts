import { Noir } from "@noir-lang/noir_js";
import { ethers } from "ethers";
import  {UltraHonkBackend} from "@aztec/bb.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";



// get the circuit file

;

const circuitPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../circuits/target/zk_panagram.json");
const circuit = JSON.parse(fs.readFileSync(circuitPath, "utf8"));

export default  async function generateProof() {

    const inputsArray = process.argv.slice(2);
    try{

        // initialize Noir with the circuit file
        const noir = new Noir(circuit);

        // initialize the backend using the circuit bytecode
        const bb =new UltraHonkBackend(circuit.bytecode, {threads: 1});
        //create the input
        const inputs = {
             //private inputs
             guess_hash: inputsArray[0],

             //public inputs
             answer_double_hash: inputsArray[1],
             address: inputsArray[2],


        };
        // Execute the circuit with the given inputs to crate a witness
        const {witness} = await noir.execute(inputs);
        // generate a proof using the witness and the backend
        const originalLog = console.log;
        console.log = () => {};
        const { proof } = await bb.generateProof(witness, {keccak: true});
        console.log = originalLog;
        //ABI encode the proof to return it in a format that can be sent to the smart contract
        const proofEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes"],
            [proof]
        )
        return proofEncoded;
        // return the proof
        
    } catch (error){
        console.log(error);
        throw error;
    }

} 

(async () => {
    generateProof()
    .then((proof) => {
        process.stdout.write(proof);
        process.exit(0);
    })
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
})();

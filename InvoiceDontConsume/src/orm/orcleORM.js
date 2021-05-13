const connectionString =  require('../dbConfig/orcleDBConfig');
const oracledb = require('oracledb');
process.env.ORA_SDTZ = 'EST';

const ormOrcle = {
    get_aged_consignment:  async(cb) => {
        console.log('Hitting Oracle: get consignment Tags');
        let connection;
        console.log(`Connection: ${connection}`);
        try {
            console.log("made it to the try.");
            connection = await oracledb.getConnection(connectionString);
            console.log(`Connection: ${connection}`);
            let results = await connection.execute(`with 
         inv as 
        (select 
            I.INVOICE_ID , to_char(II.INVOICE_DATE,'MM/DD/YYYY') invoice_date,  I.INV_ITEM_CODE, I.INV_ITEM_TAG 
        from 
            DA.ST_invoice_lines i, DA.ST_INVOICES ii 
        where 
            ii.invoice_id = i.invoice_id), 
         k as 
        (select 
            m.bp_code customer, M.ITEM_TAG_NUMBER tag_num, round(M.QTY) qty 
        from 
            kcard_master m 
        where 
            M.BP_CODE = '001871M' 
        minus 
            select 
                m.customer, M.TAG_NUM, round(M.QTY) qty 
            from 
                kcards m 
            where 
                M.CODE Like 'CONSUME%') 
    select 
        M.BP_CODE, M.INV_ITEM_CODE , M.ITEM_TAG_NUMBER, trunc(sysdate) - trunc(ship_date) days
    from 
        k, kcard_master m, inv 
    where 
        M.BP_CODE = K.CUSTOMER /*and  M.PART = K.PART */ 
        and M.ITEM_TAG_NUMBER = K.TAG_NUM 
        and M.INV_ITEM_CODE = inv.inv_item_code(+) 
        and M.ITEM_TAG_NUMBER is not null 
        and sysdate - M.SHIP_DATE >= 30 
        and inv.invoice_id is null
    order by 
        part, item_tag_number,ship_date`);
            console.log(`Getting results: ${results}`);
            if (results) {
                console.log('Results from query: ', results);
                cb(null, results);
            }
        }
        catch(error){
            cb(error, null);
        }
        finally{
            if(connection) {
                try{
                    console.log('Connection closed');
                    connection.close();
                }catch(error) {
                    console.log(`Error closing oracle connection.Error: `, error);
                }

            }
        }
    },
    update_po_num: async (incoming_data ,cb) => {
        let connection;
        try {
            console.log("Hitting update po num in orm: ", incoming_data);
            console.log("Tags: ", incoming_data.tags);
            //console.log("Tags Keys: ", Object.keys(incoming_data.tags[1]));
            connection = await oracledb.getConnection(connectionString);
            let results = false;
            let results2 = false;
            let shipto;
            for (let i = 0; i < incoming_data.tags.length; i++) {
                let keys_ = Object.keys(incoming_data.tags[i]);

                // for (let j = 0; j < keys_.length; i++) {
                    console.log(`
                    DECLARE 
                        t varchar(255);
                    BEGIN 
                        DA.CREATE_INVOICE('${incoming_data.tags[i][keys_[0]]}', trunc(sysdate), t);
                        
                        UPDATE ST_INVOICES 
                            SET cust_po_number = '${incoming_data.po_number}' 
                        where 
                            invoice_Id in (select 
                                                invoice_id 
                                            from 
                                                st_invoice_lines 
                                            where 
                                                inv_item_tag in ('${incoming_data.tags[i][keys_[2]]}') 
                                                and cust_shipto_num = '${incoming_data.tags[i][keys_[0]]}');
  
                     END;`);
                    results = await connection.execute(`
                    DECLARE 
                        t varchar(255);
                    BEGIN 
                        DA.CREATE_INVOICE('${incoming_data.tags[i][keys_[1]]}', trunc(sysdate), t);
                        
                        UPDATE ST_INVOICES 
                            SET cust_po_number = '${incoming_data.po_number}' 
                        where 
                            invoice_Id in (select 
                                                invoice_id 
                                            from 
                                                st_invoice_lines 
                                            where 
                                                inv_item_tag in ('${incoming_data.tags[i][keys_[2]]}') 
                                                and cust_shipto_num = '${incoming_data.tags[i][keys_[0]]}');
  
                     END;`);

                    console.log("results: ", results)
                // }

            };

            shipto = incoming_data.tags[0][Object.keys(incoming_data.tags[0])[0]];
            if (shipto == '001871J') {
                results2 = await connection.execute(`BEGIN PSSI.PSSI_JCI_CONS_INV_RPT_AV ('${incoming_data.po_number}', '${incoming_data.tags[0][Object.keys(incoming_data.tags[0])[0]]}'); COMMIT; END;`);
            }

            // results2 = await connection.execute(`BEGIN PSSI.PSSI_JCI_CONS_INV_RPT_AV ('${incoming_data.po_number}', '${incoming_data.tags[0][Object.keys(incoming_data.tags[0])[0]]}');`);
            console.log(`Values of result 1: ${results}: Value of result 2: ${results2}`);
            if (results && (results2 || shipto !== '001871J')) {
                cb(null, true);
            }else {
                cb(true, null);
            }

        }
        catch(error){
            cb(error, null);
        }
        finally{
            if(connection) {
                try{
                    connection.close();
                }catch(error) {
                    console.log(`Error closing oracle connection.Error: `, error);
                }

            }
        }
    }

};

module.exports = ormOrcle;

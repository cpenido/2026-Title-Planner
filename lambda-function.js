const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    };

    try {
        const { httpMethod, pathParameters, body } = event;
        const tableName = 'title-planner-data';

        if (httpMethod === 'GET') {
            // Load data
            const { dataType } = pathParameters;
            const result = await dynamodb.get({
                TableName: tableName,
                Key: { dataType, id: 'main' }
            }).promise();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.Item?.data || null)
            };
        }

        if (httpMethod === 'POST') {
            // Save data
            const { dataType, data } = JSON.parse(body);
            await dynamodb.put({
                TableName: tableName,
                Item: {
                    dataType,
                    id: 'main',
                    data,
                    lastUpdated: new Date().toISOString()
                }
            }).promise();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
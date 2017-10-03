<?php

//Add this code in the AppController.php in the class
    
    /**
     * Override this method in you controller
     * for custom query modification
     * @param type $query_options
     */
    function __rest_before_get(&$query_options){
        
    }
    
    /**
     * Overrrid this method in your controller
     * for custom result modification, analyze objects
     * add aggregate tfoot data
     * 
     * @param type $query
     * @param type $res
     */
    function __rest_after_get(&$query, &$res){
        
    }
    
    /**
     * Main method for RESTful requests
     * @param type $id
     */
    function rest($id = null){
        
        $modelName = $this->modelClass;
        
        // This example for debug info
        $res = [
            'data' => null,
            'uses' => $this->uses,
            'modelClass' => $this->modelClass,
            'modelName' => $modelName,
            'status' => 'error',
            'message' => 'Unknown message',
            'request' => [
                'here' => $this->request->here,
                'is' => [
                    'ajax' => $this->request->is('ajax'),
                    'get' => $this->request->is('get'),
                    'put' => $this->request->is('put'),
                    'delete' => $this->request->is('delete'),
                    'post' => $this->request->is('post'),
                    'options' => $this->request->is('options'),
                    'patch' => $this->request->is('patch'),
                ],                
                'data' => $this->request->data,
                'query' => $this->request->query                
            ]
        ];
        
        if ($this->request->is('ajax')){
            if ($this->request->is('get') ){
                $contain = empty($this->request->query['contain'])
                            ? []
                            : $this->request->query['contain'];
                if ($id){
                    $res['data'] = $this->$modelName->get($id, [
                        'contain' => $contain,                        
                    ]);
                } else {
                    $limit = empty($this->request->query['limit']) 
                                ? 100
                                : $this->request->query['limit'];
                    
                    $join = empty($this->request->query['join']) 
                                ? null
                                : $this->request->query['join'];
                    
                    $page = empty($this->request->query['page']) 
                                ? 1
                                : $this->request->query['page'];
                    
                    $fields = empty($this->request->query['fields'])
                            ? []
                            : $this->request->query['fields'];
                    
                    
                    
                    $filters = empty($this->request->query['filters'])
                            ? []
                            : $this->request->query['filters'];
                    
                    
                    $conditions = empty($this->request->query['conditions'])
                            ? []
                            : $this->request->query['conditions'];
                    
                    $findType = empty($this->request->query['findType'])
                            ? 'all'
                            : $this->request->query['findType'];
                    
                    $options = empty($this->request->query['options'])
                            ? null
                            : $this->request->query['options'];
                    
                    
                    if ($filters){
                        foreach ($filters as $filter_rule){
                            $conditions[] = [
                                $filter_rule['field'] . ' LIKE' => 
                                str_replace('*', '%', 
                                    $filter_rule['search']) . '%'
                            ];
                        }
                    }
                    
                    $query_options = [
                        'limit' => $limit,
                        'fields' => $fields,
                        'page' => $page,
                        'join' => $join,
                        'options' => $options,
                        'contain' => $contain,
                        'conditions' => $conditions
                    ];
                    
                    $this->__rest_before_get($query_options);
                    
                    //Database query
                    $query = $this->$modelName->find($findType, $query_options);
                    
                    //return result
                    $res['data'] =$query;
                    $res['pagination']['page'] =$page;
                    $res['pagination']['total_count'] =$query->count();
                    
                    $count = $query->rowCountAndClose();
                    
                    $res['pagination']['count'] = $count;
                    $res['pagination']['limit'] = $limit;
                    $res['pagination']['start'] = $limit * ($page - 1) + 1 ;
                    $res['pagination']['end']   = $count < $limit 
                            ? $limit * ($page - 1) + $count
                            : $limit * $page;
                    
                    //trigger process result after results
                    $this->__rest_after_get($query, $res);
                    
                    $res['status'] = 'success';
                }
                
            }

            if ($this->request->is('options') ){
                //return a columns list with properties
            }
            
            if ($this->request->is('put') ){
                //update records
                if ($id){
                    //once row
                } else {
                    //many
                    $updated = [];
                    if (isset($this->request->data['update'])){
                        foreach ($this->request->data['update'] as $row){
                            $datum = $this->$modelName->get($row['id']);
                            
                            foreach ($row['data'] as $field => $value){
                                $value = $value === 'true'  ? true  : $value;
                                $value = $value === 'false' ? false : $value;
                                $value = $value === '' ? null : $value;
                                
                                $row['data'][$field] = $value;                                
                            }
                            
                            $this->$modelName->patchEntity($datum, $row['data']);
                            
                            $saved_res = [
                                        'id' => $row['id'],
                                        'cid' => $row['cid'],
                                        'status' => 'error',
                                        'datum' => $datum
                                    ];
                            
                            $saved_status = $this->$modelName->save($datum, [
                                'checkRules' => false
                            ]);
                            
                            $saved_res['debug'] = $saved_status;
                            
                            if ($saved_status){
                                $saved_res['status'] = 'saved';
                                }
                                
                                    $updated[] = $saved_res;
                                
                        }
                    }
                    
                    $res['updated'] = $updated;
                    //$this->__save($modelName);
                }
            }
            
            if ($this->request->is('post') ){                
                //Add new records
                    $add = [];
                    if (isset($this->request->data['add'])){
                        $res['added'] = [];
                        foreach ($this->request->data['add'] as $row){
                            $entity = $this->$modelName->newEntity();     
                            foreach ($row['data'] as $field => $value){
                                $value = $value === 'true'  ? true  : $value;
                                $value = $value === 'false' ? false : $value;
                                $value = $value === '' ? null : $value;
                                
                                $row['data'][$field] = $value;                                
                            }
                            
                            $this->$modelName->patchEntity($entity, $row['data']);
                            
                            $saved_res = [
                                        'id' => false,
                                        'cid' => $row['cid'],
                                        'status' => 'error',
                                        'datum' => $entity
                                    ];
                            
                            $saved_status = $this->$modelName->save($entity, [
                                'checkRules' => false
                            ]);
                            
                            if ($saved_status){
                                $saved_res['status'] = 'success';
                                $saved_res['id'] = $entity->id;
                            } 
                            
                            $res['added'][] = $saved_res;
                        }
                    }
                
            }
            
            if ($this->request->is('delete')){
                if ($id){
                    //delete once record!!
                    $entity = $this->$modelName->get($id);
                    $result = $this->$modelName->delete($entity);
                    $res['delete_result'] = $result;
                    if ($result){
                        $res['status'] = 'success';
                    }
                    
                } else {
                    //many deleted
                }
            }
        }        
        
        return $this->json($res);
    }    

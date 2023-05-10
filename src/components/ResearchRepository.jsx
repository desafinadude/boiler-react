import React from 'react';

import axios from 'axios';
import Airtable from 'airtable';

import getCountryISO2 from 'country-iso-3-to-2';
import ReactCountryFlag from 'react-country-flag';

import { Icon } from '@mdi/react';
import {  mdiInformationSlabCircle } from '@mdi/js';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Popover from 'react-bootstrap/Popover';

import { MultiSelect } from "react-multi-select-component";


Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.AIRTABLE_API_KEY
});


export class ResearchRepository extends React.Component {

    

    constructor(){
        super();
        this.state = {
            base: Airtable.base('apph33lbIneJ3vYF0'),
            regions: [],
            selected_regions: [],
            sectors: [],
            selected_sectors: [],
            years: [],
            records: [],
            finalFilter: ''
        }
        
    }

    componentDidMount() {
        this.listRecords('Year', 'Grid view', 'years', '', [{field: "Year", direction: "asc"}]);
        this.listRecords('Region', 'Grid view', 'regions', '', [{field: "Country name", direction: "asc"}]);
        this.listRecords('Sectors', 'Grid view', 'sectors', '', [{field: "Sector", direction: "asc"}]);
        this.listRecords('Research Directory', 'Grid view', 'records', '', [{field: "Original title", direction: "asc"}]);
    }


    // getSnapshotBeforeUpdate(prevProps, prevState) {}
    // componentDidUpdate(prevProps, prevState, snapshot) {}

    listRecords = (table, view, state, filter = '', sort) => {

        let self = this;

        let recordsArray = []; 

        this.state.base(table).select({
            view: view,
            filterByFormula: filter,
            sort: sort
        }).eachPage(function page(records, fetchNextPage) {
            recordsArray = recordsArray.concat(records);
            
            fetchNextPage();

        }, function done(err) {
            if (err) { console.error(err); return; }
            self.setState({[state]: recordsArray})
        });
    }


    setFilter = (field, val) => {

        let self = this;

        self.setState({[field]: val}, () => {
            self.filter();
        });

        
    
    }

    filter = (field, val) => {
    
        let self = this;
        
        let filter = '';
        let search = '';
        let regionFilter = '';
        let sectorFilter = '';
        let finalFilter = '';


        
        if(self.state.selected_regions.length == 0) {
            regionFilter = '';
        } else if(self.state.selected_regions.length == 1) {
            regionFilter = `FIND("${self.state.selected_regions[0].value}", ARRAYJOIN({Region})) > 0`;
        } else if(self.state.selected_regions.length > 1) {
            regionFilter = 'OR(';
            self.state.selected_regions.forEach((region,index) => {
                regionFilter += `FIND("${region.value}", ARRAYJOIN({Region})) > 0`;
                if(index < self.state.selected_regions.length - 1) {
                    regionFilter += ',';
                }
            });
            regionFilter += ')';
        }
            

        if(self.state.selected_sectors.length == 0) {
            sectorFilter = '';
        } else if(self.state.selected_sectors.length == 1) {
            sectorFilter = `FIND("${self.state.selected_sectors[0].value}", ARRAYJOIN({Sectors})) > 0`;
        } else if(self.state.selected_sectors.length > 1) {
            sectorFilter = 'OR(';
            self.state.selected_sectors.forEach((sector,index) => {
                sectorFilter += `FIND("${sector.value}", ARRAYJOIN({Sectors})) > 0`;
                if(index < self.state.selected_sectors.length - 1) {
                    sectorFilter += ',';
                }
            });
            sectorFilter += ')';
        }

        if(regionFilter != '' && sectorFilter != '') {
            filter = `AND(${regionFilter},${sectorFilter})`;
        } else if(regionFilter != '' && sectorFilter == '') {
            filter = regionFilter;
        } else if(regionFilter == '' && sectorFilter != '') {
            filter = sectorFilter;
        } else {
            filter = '';
        }

        if(field == 'Resource') {
            if(val.length > 3) {
                search = `OR(FIND("${val}", {Original title}) > 0,FIND("${val}", {Short summary}) > 0)`;
            } else {
                search = '';
            }
        }

        if(filter != '' && search != '') {
            finalFilter = `AND(${filter},${search})`;
        } else if(filter != '' && search == '') {
            finalFilter = filter;
        } else if(filter == '' && search != '') {
            finalFilter = search;
        } else {
            finalFilter = '';
        }

        self.setState({finalFilter: finalFilter}, () => 
            this.listRecords('Research Directory', 'Grid view', 'records', finalFilter, [{field: document.getElementById('sort').value, direction: "asc"}])
        );
    
    }

    sort = (field) => {
        let self = this;
        let sort = '';
        
        self.listRecords('Research Directory', 'Grid view', 'records', self.state.finalFilter, [{field: document.getElementById('sort').value, direction: "asc"}]);
    }


    truncateString = (str, n) => {
        if (str.length > n) {
            return str.slice(0, n) + '...';
        } else {
            return str;
        }
    }

   

    render() {
        return (<Container className="py-5">
            <Row>
                <Col>
                    <Form.Control type="search" placeholder="Search for a keyword..." onKeyUp={ e => this.filter('Resource', e.target.value) }/>
                </Col>
                <Col md={3}>
                    <MultiSelect
                        options={this.state.sectors.map((sector) => { 
                            return { 
                                label: sector.fields['Sector'], 
                                value: sector.fields['Sector']
                            }
                            })
                        }
                        value={this.state.selected_sectors}
                        onChange={e => this.setFilter('selected_sectors', e)}
                        valueRenderer={
                            (selected, _options) => {
                                return selected.length
                                  ? selected.length + " Sectors Selected"
                                  : "Sectors";
                            }
                        }
                    />
                </Col>
                <Col md={3}>
                    <MultiSelect
                        options={this.state.regions.map((region) => { 
                            return { 
                                label: region.fields['Country name'], 
                                value: region.fields['Country name']
                            }
                            })
                        }
                        value={this.state.selected_regions}
                        onChange={e => this.setFilter('selected_regions', e)}
                        labelledBy="Select Regions"
                        valueRenderer={
                            (selected, _options) => {
                                return selected.length
                                  ? selected.length + " Regions Selected"
                                  : "Regions";
                            }
                        }
                    />
                </Col>
                <Col md="auto">
                    <Form.Select onChange={e => this.sort(e.target.value)} id="sort">
                        <option value="Original title">Sort By Title</option>
                        <option value="Year published">Sort By Year</option>
                    </Form.Select>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Table hover className="mt-4">
                        <thead>
                            <tr>
                                <th>Resource</th>
                                <th>Sectors</th>
                                <th>Countries</th>
                                <th>Years</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                this.state.records.map((record) => {
                                    return <tr key={record.id}>
                                        <td width="55%">
                                            <Row>
                                                <Col><a href={record.fields['External URL']} target="_blank">{this.truncateString(record.fields['Original title'], 70)}</a></Col>
                                                <Col xs="auto">
                                                    <OverlayTrigger overlay={
                                                        <Tooltip>
                                                            {record.fields['Short summary']}
                                                        </Tooltip>
                                                    }>
                                                        <Icon color="#6c6d6d" path={mdiInformationSlabCircle} size={1} />
                                                    </OverlayTrigger>
                                                </Col>
                                            </Row>
                                            
                                        </td>
                                        <td>
                                            {
                                                record.fields['Sectors'].map((sectorId, index) => {
                                                    let sector = this.state.sectors.filter(sector => sector.id === sectorId)[0];
                                                    return <div className="chip" key={index}>{sector ? sector.fields['Sector'] : ''}</div>
                                                })
                                            }
                                        </td>
                                        <td>
                                            {
                                                record.fields['Region'].map((regionId, index) => {
                                                    let region = this.state.regions.filter(region => region.id === regionId)[0];
                                                    return <div className="chip" key={index}>{region ? <>
                                                    <div style={{width: '1.4em', height: '1.4em', borderRadius: '50%', overflow: 'hidden', position: 'relative', display: 'inline-block', top: '5px', backgroundColor: '#ccc'}} className="border">
                                                        <ReactCountryFlag 
                                                            countryCode={getCountryISO2(region.fields['Country code'])}
                                                            svg
                                                            style={{
                                                                position: 'absolute', 
                                                                top: '30%',
                                                                left: '30%',
                                                                marginTop: '-50%',
                                                                marginLeft: '-50%',
                                                                fontSize: '1.8em',
                                                                lineHeight: '1.8em',
                                                            }} 
                                                        /></div>{region.fields['Country name']}</> : ''}</div>
                                                })
                                            }
                                        </td>
                                        <td>
                                            {
                                                record.fields['Year published'].map((yearId, index) => {
                                                    let year = this.state.years.filter(year => year.id === yearId)[0];
                                                    return <div className="chip" key={index}>{year ? year.fields['Year'] : ''}</div>
                                                })
                                            }
                                        </td>
                                    </tr>
                                })
                            }
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </Container>)
    }

}
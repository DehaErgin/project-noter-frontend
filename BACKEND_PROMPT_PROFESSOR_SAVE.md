# Backend Prompt - Professor Grade Calculator Kaydetme

## 🎯 Sorun

Professor sayfasında (Grade Calculator) yapılan değişiklikler backend'e kaydedilmiyor. Assessment'lar, Learning Outcomes, bağlantılar ve notlar sadece frontend state'te tutuluyor.

## 📋 Mevcut Durum

### Frontend'de Yapılan İşlemler

Professor sayfasında şunlar yapılabiliyor:

1. **Assessment Components:**
   - Assessment ekleme/silme
   - Not girişi
   - Percentage'lar
   - Assessment → Learning Outcome bağlantıları

2. **Learning Outcome Components:**
   - Learning Outcome ekleme/silme
   - Detail/description
   - Percentage'lar
   - Learning Outcome → Program Outcome bağlantıları
   - Hesaplanan notlar

3. **Program Outcome Components:**
   - Program Outcomes admin'den çekiliyor (sadece okuma)
   - Hesaplanan notlar gösteriliyor

### Sorun

- ✅ Frontend'de tüm değişiklikler state'te tutuluyor
- ❌ Backend'e kaydetme işlemi yok
- ❌ Sayfa yenilendiğinde tüm veriler kayboluyor
- ❌ Öğrenciler bu verileri göremiyor

---

## ✅ Yapılması Gerekenler

### 1. Course'a Assessment'ları Kaydetme

**Endpoint:** `POST /api/professors/{professorId}/courses/{courseId}/assessments/`

**Request Body:**
```json
{
  "title": "Midterm Exam",
  "description": "Midterm exam description",
  "type": "exam",
  "grade": 85.5,
  "weight": 30.0,
  "learning_outcome_connections": [
    {
      "learning_outcome_id": 1,
      "contribution": 50.0
    },
    {
      "learning_outcome_id": 2,
      "contribution": 50.0
    }
  ]
}
```

**Success Response (201):**
```json
{
  "id": 1,
  "title": "Midterm Exam",
  "description": "Midterm exam description",
  "type": "exam",
  "grade": 85.5,
  "weight": 30.0,
  "course_id": 1,
  "learning_outcome_connections": [...]
}
```

### 2. Course'a Learning Outcomes Kaydetme

**Endpoint:** `POST /api/professors/{professorId}/courses/{courseId}/learning-outcomes/`

**Request Body:**
```json
{
  "code": "LO1",
  "description": "Learning Outcome 1 description",
  "program_outcome_connections": [
    {
      "program_outcome_id": 1,
      "weight": 30.0
    },
    {
      "program_outcome_id": 2,
      "weight": 70.0
    }
  ]
}
```

**Success Response (201):**
```json
{
  "id": 1,
  "code": "LO1",
  "description": "Learning Outcome 1 description",
  "course_id": 1,
  "program_outcome_connections": [...]
}
```

### 3. Tüm Verileri Tek Seferde Kaydetme (Bulk Save)

**Endpoint:** `POST /api/professors/{professorId}/courses/{courseId}/grade-data/`

**Request Body:**
```json
{
  "assessments": [
    {
      "title": "Midterm Exam",
      "description": "...",
      "type": "exam",
      "grade": 85.5,
      "weight": 30.0,
      "learning_outcome_connections": [
        {
          "learning_outcome_id": 1,
          "contribution": 50.0
        }
      ]
    }
  ],
  "learning_outcomes": [
    {
      "code": "LO1",
      "description": "...",
      "program_outcome_connections": [
        {
          "program_outcome_id": 1,
          "weight": 30.0
        }
      ]
    }
  ]
}
```

**Success Response (200):**
```json
{
  "message": "Grade data saved successfully",
  "assessments": [...],
  "learning_outcomes": [...]
}
```

### 4. Kaydedilmiş Verileri Getirme

**Endpoint:** `GET /api/professors/{professorId}/courses/{courseId}/grade-data/`

**Success Response (200):**
```json
{
  "assessments": [
    {
      "id": 1,
      "title": "Midterm Exam",
      "description": "...",
      "type": "exam",
      "grade": 85.5,
      "weight": 30.0,
      "learning_outcome_connections": [...]
    }
  ],
  "learning_outcomes": [
    {
      "id": 1,
      "code": "LO1",
      "description": "...",
      "program_outcome_connections": [...]
    }
  ]
}
```

---

## 🔧 Backend Implementation Önerileri

### 1. Models

**Assessment Model:**
```python
class Assessment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assessments')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=50)  # exam, homework, project, etc.
    grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2)  # Percentage
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Assessment-LO Connection Model:**
```python
class AssessmentLOConnection(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='lo_connections')
    learning_outcome = models.ForeignKey(LearningOutcome, on_delete=models.CASCADE)
    contribution = models.DecimalField(max_digits=5, decimal_places=2)  # Percentage
```

**Learning Outcome Model (zaten var, course'a bağlanmalı):**
```python
class LearningOutcome(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='learning_outcomes', null=True, blank=True)
    code = models.CharField(max_length=50)
    description = models.TextField()
    # ... diğer field'lar
```

**LO-PO Connection Model (zaten var):**
```python
class LOPOConnection(models.Model):
    learning_outcome = models.ForeignKey(LearningOutcome, on_delete=models.CASCADE)
    program_outcome = models.ForeignKey(ProgramOutcome, on_delete=models.CASCADE)
    weight = models.DecimalField(max_digits=5, decimal_places=2)
```

### 2. View Functions

**Bulk Save Endpoint:**
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_grade_data(request, professor_id, course_id):
    """
    Save assessment and learning outcome data for a course.
    
    POST /api/professors/{professorId}/courses/{courseId}/grade-data/
    """
    try:
        # 1. Verify professor owns this course
        course = Course.objects.get(id=course_id, professor_id=professor_id)
        
        # 2. Parse request data
        assessments_data = request.data.get('assessments', [])
        learning_outcomes_data = request.data.get('learning_outcomes', [])
        
        # 3. Save assessments
        saved_assessments = []
        for assessment_data in assessments_data:
            assessment = Assessment.objects.create(
                course=course,
                title=assessment_data['title'],
                description=assessment_data.get('description', ''),
                type=assessment_data.get('type', 'assignment'),
                grade=assessment_data.get('grade'),
                weight=assessment_data.get('weight', 0)
            )
            
            # Save LO connections
            for conn_data in assessment_data.get('learning_outcome_connections', []):
                AssessmentLOConnection.objects.create(
                    assessment=assessment,
                    learning_outcome_id=conn_data['learning_outcome_id'],
                    contribution=conn_data['contribution']
                )
            
            saved_assessments.append(assessment)
        
        # 4. Save learning outcomes
        saved_los = []
        for lo_data in learning_outcomes_data:
            lo = LearningOutcome.objects.create(
                course=course,
                code=lo_data['code'],
                description=lo_data.get('description', '')
            )
            
            # Save PO connections
            for conn_data in lo_data.get('program_outcome_connections', []):
                LOPOConnection.objects.create(
                    learning_outcome=lo,
                    program_outcome_id=conn_data['program_outcome_id'],
                    weight=conn_data['weight']
                )
            
            saved_los.append(lo)
        
        # 5. Return saved data
        return Response({
            "message": "Grade data saved successfully",
            "assessments": AssessmentSerializer(saved_assessments, many=True).data,
            "learning_outcomes": LearningOutcomeSerializer(saved_los, many=True).data
        }, status=status.HTTP_200_OK)
        
    except Course.DoesNotExist:
        return Response(
            {"message": "Course not found or you don't have permission"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"message": f"Error saving grade data: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

**Get Grade Data Endpoint:**
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_grade_data(request, professor_id, course_id):
    """
    Get saved assessment and learning outcome data for a course.
    
    GET /api/professors/{professorId}/courses/{courseId}/grade-data/
    """
    try:
        # Verify professor owns this course
        course = Course.objects.get(id=course_id, professor_id=professor_id)
        
        # Get assessments with LO connections
        assessments = Assessment.objects.filter(course=course).prefetch_related('lo_connections')
        
        # Get learning outcomes with PO connections
        learning_outcomes = LearningOutcome.objects.filter(course=course).prefetch_related('po_connections')
        
        return Response({
            "assessments": AssessmentSerializer(assessments, many=True).data,
            "learning_outcomes": LearningOutcomeSerializer(learning_outcomes, many=True).data
        }, status=status.HTTP_200_OK)
        
    except Course.DoesNotExist:
        return Response(
            {"message": "Course not found or you don't have permission"},
            status=status.HTTP_404_NOT_FOUND
        )
```

### 3. URL Routing

```python
# urls.py
path('professors/<int:professor_id>/courses/<int:course_id>/grade-data/',
     views.save_grade_data, name='save_grade_data'),
path('professors/<int:professor_id>/courses/<int:course_id>/grade-data/',
     views.get_grade_data, name='get_grade_data'),
```

---

## 📝 Frontend'den Gönderilecek Data Formatı

### Assessment Component Format

```javascript
{
  id: 1234567890,  // Frontend'de oluşturulan ID (Date.now())
  name: "Midterm Exam",
  grades: [85.5],
  percentages: [30.0],
  connections: [
    {
      type: "learning",
      targetId: 1,  // Learning Outcome ID
      percentageIndex: 0,
      gradeIndex: 0
    }
  ]
}
```

**Backend'e Gönderilecek Format:**
```json
{
  "title": "Midterm Exam",
  "description": "",
  "type": "exam",
  "grade": 85.5,
  "weight": 30.0,
  "learning_outcome_connections": [
    {
      "learning_outcome_id": 1,
      "contribution": 30.0
    }
  ]
}
```

### Learning Outcome Component Format

```javascript
{
  id: 1234567891,
  name: "LO1",
  detail: "Learning Outcome 1 description",
  grades: [82.3],
  percentages: [50.0, 50.0],
  connections: [
    {
      type: "program",
      targetId: 1,  // Program Outcome ID
      percentageIndex: 0,
      gradeIndex: 0
    },
    {
      type: "program",
      targetId: 2,
      percentageIndex: 1,
      gradeIndex: 0
    }
  ]
}
```

**Backend'e Gönderilecek Format:**
```json
{
  "code": "LO1",
  "description": "Learning Outcome 1 description",
  "program_outcome_connections": [
    {
      "program_outcome_id": 1,
      "weight": 50.0
    },
    {
      "program_outcome_id": 2,
      "weight": 50.0
    }
  ]
}
```

---

## 🔄 Data Transformation

Frontend'den backend'e gönderilirken data transform edilmeli:

**Assessment:**
- `name` → `title`
- `grades[0]` → `grade`
- `percentages[0]` → `weight`
- `connections` (type: "learning") → `learning_outcome_connections`

**Learning Outcome:**
- `name` → `code`
- `detail` → `description`
- `connections` (type: "program") → `program_outcome_connections`
- `percentages` → `weight` (her connection için)

---

## ✅ Test Senaryoları

### Senaryo 1: İlk Kayıt

**Request:**
```
POST /api/professors/1/courses/1/grade-data/
Body: {
  assessments: [...],
  learning_outcomes: [...]
}
```

**Beklenen:**
- Status: 200
- Assessment'lar oluşturulur
- Learning Outcomes oluşturulur
- Bağlantılar oluşturulur

### Senaryo 2: Güncelleme

**Request:**
```
POST /api/professors/1/courses/1/grade-data/
Body: {
  assessments: [updated assessments],
  learning_outcomes: [updated learning outcomes]
}
```

**Beklenen:**
- Mevcut veriler güncellenir veya yenileri eklenir
- Silinen veriler kaldırılır (opsiyonel)

### Senaryo 3: Veri Getirme

**Request:**
```
GET /api/professors/1/courses/1/grade-data/
```

**Beklenen:**
- Status: 200
- Kaydedilmiş assessment'lar döner
- Kaydedilmiş learning outcomes döner

---

## 🆘 Önemli Notlar

1. **Course Ownership:**
   - Professor'ın bu course'a sahip olduğu kontrol edilmeli
   - `Course.objects.get(id=course_id, professor_id=professor_id)`

2. **Data Validation:**
   - Assessment title zorunlu olmalı
   - Learning Outcome code zorunlu olmalı
   - Percentage'lar 0-100 arası olmalı
   - Grade'ler 0-100 arası olmalı

3. **Connection Validation:**
   - Learning Outcome ID'leri geçerli olmalı
   - Program Outcome ID'leri geçerli olmalı
   - Connection weight'leri 0-100 arası olmalı

4. **Update vs Create:**
   - Frontend'den gelen ID'ler frontend'de oluşturuluyor (Date.now())
   - Backend'de yeni ID'ler oluşturulacak
   - Update için frontend'den backend ID'leri gönderilmeli (veya her seferinde tüm verileri gönder)

---

## 📊 Önerilen Yaklaşım

### Yaklaşım 1: Her Seferinde Tüm Verileri Gönder (Basit)

- Frontend her "Save" butonuna tıklandığında tüm assessment ve LO'ları gönderir
- Backend mevcut verileri siler, yenilerini oluşturur
- **Avantaj:** Basit, conflict yok
- **Dezavantaj:** Her seferinde tüm veriler gönderilir

### Yaklaşım 2: Update/Create/Delete Ayrı Ayrı (Karmaşık)

- Frontend hangi verilerin eklendiğini, güncellendiğini, silindiğini takip eder
- Backend'e ayrı ayrı gönderir
- **Avantaj:** Sadece değişen veriler gönderilir
- **Dezavantaj:** Karmaşık, frontend'de state management gerekir

**Öneri:** İlk aşamada Yaklaşım 1 kullanılabilir.

---

## 🔗 Endpoint Özeti

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/professors/{id}/courses/{id}/grade-data/` | POST | Tüm verileri kaydet |
| `/api/professors/{id}/courses/{id}/grade-data/` | GET | Kaydedilmiş verileri getir |

**Not:** `{id}` hem professor_id hem de course_id için integer.

---

Bu prompt'u backend geliştiricisine verin ve endpoint'leri oluşturmasını isteyin.

